import AsyncStorage from '@react-native-community/async-storage'
import StringifyDataWriter from './stringify-data-writer'
import moment from 'moment'
import LogRow from '../LogRow'
import BaseDataWriter from './BaseDataWriter'

class SentRow {
  id: string
  success?: boolean
  sendTimeStamp?: any

  constructor(id: string) {
    this.id = id
  }
}

type StorageServerHocWriterOptions = {
  serverUrl?: string
  getExtraData?: Function
  modifyRowBeforeSend?: Function
  appendToLogRow(logRow: LogRow): LogRow
  skipSendingMessagesOlderThen?: moment.Moment
  sendInterval: number
  batchSize: number
  isDebug: boolean
  sendLevels: string[]
  serializeData?: Function
}

/**
 * @typedef {Object} RowTuple
 * @property {LogRow[]} rowsToSend - The LogRows to send to the server
 * @property {SentRow[]} sentToServerRows - The Rows already sent to the server
 */

type RowTuple = {
  rowsToSend: LogRow[]
  sentToServerRows: SentRow[]
}

/**
 * A Data Writer that will ship logs to a server?
 */
export default class StorageServerHocWriter implements BaseDataWriter {
  static SERVER_SEND_STORAGE_KEY = 'debug-rows-SERVER_SEND_STORAGE_KEY'

  sendQueue: LogRow[]
  writer: BaseDataWriter
  options: StorageServerHocWriterOptions
  sentToServerRows: SentRow[]
  initPromise: Promise<SentRow[]>
  initalRowFetchPromise?: Promise<LogRow[]>
  initalSendToServerPromise?: Promise<LogRow[]>

  get readOnly() {
    return this.writer.readOnly
  }

  /**
   * Creates a new instance of StorageServerHocWriter
   *
   * @param   {any}  writer   The Data Writer to persist the Log Rows
   * @param   {StorageServerHocWriterOptions}  options  A set of options for the storage
   *
   */
  constructor(writer?: BaseDataWriter, options?: StorageServerHocWriterOptions) {
    this.writer = writer || new StringifyDataWriter(AsyncStorage)
    this.options = {
      serverUrl: undefined,
      getExtraData: () => undefined,
      modifyRowBeforeSend: undefined,
      appendToLogRow: (logRow) => logRow,
      skipSendingMessagesOlderThen: undefined,
      sendInterval: 10000,
      batchSize: 30,
      isDebug: true,
      sendLevels: ['all'],
    }
    this.options = { ...this.options, ...options }
    this.sentToServerRows = []
    this.sendQueue = []
    this.initPromise = this.getSentToServerRows().then((rows) => {
      this.sentToServerRows = rows
      return rows
    })
  }

  logRowCreated(logRow: LogRow): void {
    throw new Error('Method not implemented.')
  }

  appendToLogRow(logRow: LogRow): LogRow {
    throw new Error('Method not implemented.')
  }
  initalDataRead(logRows: LogRow[]): void {
    throw new Error('Method not implemented.')
  }

  /**
   * Sets the readOnly flag
   *
   * @param   {boolean}  readOnly  The new readOnly status
   *
   * @return  {void}
   */
  setReadOnly(readOnly: boolean): void {
    this.writer.setReadOnly(readOnly)
  }

  /**
   * Gets LogRows from the storage writer
   *
   * @return  {Promise<LogRow[]>}  The retrieved LogRows
   */
  async getRows(): Promise<LogRow[]> {
    if (!this.initalRowFetchPromise) {
      await this.initPromise
      this.initalRowFetchPromise = this.writer.getRows()
      const logRows = await this.initalRowFetchPromise
      await this.filterRemoved(logRows)
      const logRowsToSend = logRows.filter((logRow) => this.shouldAppendRowToQueue(logRow, this.sentToServerRows))
      this.addToQueue(logRowsToSend)
      this.sendToServerLoop()
      return logRows
    }
    return await this.writer.getRows()
  }

  /**
   * Inserts new LogRows or return the provided LogRows if in ReadOnly mode
   *
   * @param   {LogRow[]}  logRows  New LogRows to insert
   * @param   {LogRow[]}  allRows  The existing LogRows
   *
   * @return  {Promise<LogRow[]>}           Some LogRows
   */
  async insertRows(logRows: LogRow[] = [], allRows: LogRow[]): Promise<LogRow[]> {
    if (this.writer.readOnly) {
      return logRows
    }
    const rows = await this.writer.insertRows(logRows, allRows)
    await this.initPromise
    this.addToQueue(logRows.filter((logRow) => this.shouldAppendRowToQueue(logRow, this.sentToServerRows)))
    return rows
  }

  /**
   * Removes all LogRows
   *
   * @return  {Promise<void>}
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(StorageServerHocWriter.SERVER_SEND_STORAGE_KEY)
    this.sendQueue = []
    this.sentToServerRows = []
    await this.writer.clear()
  }

  /**
   * Filter out LogRows that have been removed
   *
   * @param   {LogRow[]}  logRows  LogRows to remove
   *
   * @return  {Promise<LogRow[]>}           Echo the proivded LogRows
   */
  async filterRemoved(logRows: LogRow[]): Promise<LogRow[]> {
    await this.initPromise
    if (this.sentToServerRows) {
      this.sentToServerRows = this.sentToServerRows.filter((sentRow) => logRows.some((row) => row.id === sentRow.id))
      await this.setSentToServerRows(this.sentToServerRows)
    }
    return logRows
  }

  /**
   * Periodically attempts to send LogRows to the configured server
   *
   * @return  {Promise<void>}
   */
  async sendToServerLoop(): Promise<void> {
    if (!this.initalSendToServerPromise && this.options.sendInterval) {
      try {
        this.initalSendToServerPromise = this.sendToServer(this.options.batchSize)
        await this.initalSendToServerPromise
      } catch (err) {
        this.log('[StorageServerHocWriter] error while sending clientLog to server', err)
      } finally {
        setTimeout(() => {
          this.sendToServerLoop()
        }, this.options.sendInterval)
      }
    }
  }

  /**
   * Flush the send queue to the server
   *
   * @return  {Promise<void>}
   */
  async sendAllMessagesToServer(): Promise<void> {
    await this.initPromise
    await this.initalRowFetchPromise
    await this.sendToServer(this.sendQueue.length)
  }

  /**
   * Sends a batch of LogRows to a server
   *
   * @param   {number}  batchSize  The number of LogRows to send in each batch
   *
   * @return  {Promise<LogRow[]>}             The remaining LogRows to send to the server
   */
  async sendToServer(batchSize: number): Promise<LogRow[]> {
    const { rowsToSend, sentToServerRows } = this.getPostData(batchSize)
    if (!this.options.serverUrl) {
      throw new Error('You need to supply an serverUrl option to StorageServerHocWriter')
    }
    if (rowsToSend && rowsToSend.length) {
      try {
        const data = {
          rows: this.options.modifyRowBeforeSend
            ? rowsToSend.map((row) => this.options.modifyRowBeforeSend!(row))
            : rowsToSend,
          extraData: this.options.getExtraData ? this.options.getExtraData() : undefined,
        }
        this.log(`Sending ${rowsToSend.length} log-rows to server`)
        const response = await fetch(this.options.serverUrl, {
          method: 'POST',
          body: this.options.serializeData ? this.options.serializeData(data) : JSON.stringify(data),
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          this.log(response)
          throw new Error('Failed sending logRows to server')
        }
        sentToServerRows.forEach((row) => (row.success = true))
        rowsToSend.forEach((row) => this.removeFromSendQueue(row))
        return rowsToSend
      } finally {
        await this.setSentToServerRows(this.sentToServerRows)
      }
    }
    return []
  }

  /**
   * Removes a LogRow from the sendQueue
   *
   * @param   {LogRow}  row  The LogRow to remove
   *
   * @return  {void}
   */
  removeFromSendQueue(row: LogRow): void {
    const rowIndex = this.sendQueue.indexOf(row)
    if (rowIndex !== -1) {
      this.sendQueue.splice(rowIndex, 1)
    }
  }

  /**
   * Creates an array of LogRows that will be sent to the server
   *
   * @param   {number}  batchSize  The number of LogRows to send
   *
   * @return  {RowTuple}             The LogRows that are ready to send to the server
   */
  getPostData(batchSize: number): RowTuple {
    if (this.sendQueue && this.sendQueue.length) {
      const rowsToSend = this.sendQueue.slice(0, batchSize)
      if (rowsToSend && rowsToSend.length) {
        const sentToServerRows = rowsToSend.map((rowToSend) => {
          let sentToServerRow = this.sentToServerRows.find((row) => row.id === rowToSend.id)
          if (!sentToServerRow) {
            sentToServerRow = {
              id: rowToSend.id,
              success: false,
            }
            this.sentToServerRows.push(sentToServerRow)
          }
          sentToServerRow.sendTimeStamp = moment()
          return sentToServerRow
        })
        return { rowsToSend, sentToServerRows }
      }
    }
    return { rowsToSend: [], sentToServerRows: [] }
  }

  /**
   * Determines if the LogRow should be queued for sending to the server
   * Filters out LogRows that are too old
   *
   * @param   {LogRow}  logRow            LogRow for consideration
   * @param   {SentRow[]}  sentToServerRows  The LogRows that have been sent to the server
   *
   * @return  {boolean}                    The decision of whether the LogRow should be sent or not
   */
  shouldAppendRowToQueue(logRow: LogRow, sentToServerRows: SentRow[]): boolean {
    if (this.options.skipSendingMessagesOlderThen && logRow.timeStamp < this.options.skipSendingMessagesOlderThen) {
      return false
    }
    if (!this.includedLevel(logRow)) {
      return false
    }
    const foundRow = sentToServerRows.find((serverRow) => serverRow.id === logRow.id)
    const shouldAddToQueue = !foundRow || !foundRow.success
    return shouldAddToQueue
  }

  /**
   * Checks to see if the LogRow has a Log Level that should be included
   *
   * @param   {LogRow}  logRow  LogRow to be checked
   *
   * @return  {boolean}          Decision for if the LogRow should be included
   */
  includedLevel(logRow: LogRow): boolean {
    return this.options.sendLevels.indexOf('all') !== -1 || this.options.sendLevels.indexOf(logRow.level) !== -1
  }

  /**
   * Adds LogRows to the sendQueue
   *
   * @param   {LogRow[]}  logRows  LogRows to add to the sendQueue
   *
   * @return  {void}
   */
  addToQueue(logRows: LogRow[]): void {
    if (logRows && logRows.length) {
      this.sendQueue = this.sendQueue || []
      this.sendQueue = this.sendQueue.concat(logRows)
    }
  }

  /**
   * Log to the console
   *
   * @param   {any[]}  args  The args to forward to console.log
   *
   * @return  {void}
   */
  log(...args: [any?, ...any[]]): void {
    if (this.options.isDebug) {
      console.log(...args)
    }
  }

  /**
   * Gets the LogRows that have been sent to the server
   *
   * @return  {Promise<SentRow[]>}  The sent LogRows
   */
  async getSentToServerRows(): Promise<SentRow[]> {
    const rowsString = await AsyncStorage.getItem(StorageServerHocWriter.SERVER_SEND_STORAGE_KEY)
    if (rowsString) {
      return JSON.parse(rowsString)
    }
    return await this.setSentToServerRows([])
  }

  /**
   * Sets the LogRows that have been sent to the server
   *
   * @param   {SentRow[]}  sentToServerRows  The LogRows that have been sent to the server
   *
   * @return  {Promise<SentRow[]>}                    Echo the sent LogRows
   */
  async setSentToServerRows(sentToServerRows: SentRow[]): Promise<SentRow[]> {
    await AsyncStorage.setItem(StorageServerHocWriter.SERVER_SEND_STORAGE_KEY, JSON.stringify(sentToServerRows || []))
    return sentToServerRows
  }
}
