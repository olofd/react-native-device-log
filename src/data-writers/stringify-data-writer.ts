import moment from 'moment'
import BaseDataWriter from './BaseDataWriter'
import LogRow from '../LogRow'

/**
 * Stores LogRows as JSON in the provided storage
 */
export default class StringifyDataWriter implements BaseDataWriter {
  static STORAGEKEY = 'debug-rows'

  _readOnly: boolean
  storage: any

  get readOnly(): boolean {
    return this._readOnly
  }

  /**
   * Creates a new instance of the StringifyDataWriter
   *
   * @param   {any}  storage  Somewhere to store the LogRows
   */
  constructor(storage: any) {
    this._readOnly = true
    this.storage = storage
  }

  /**
   * Sets the read only mode
   *
   * @param   {boolean}  readOnly  The new readOnly mode
   *
   * @return  {void}
   */
  setReadOnly(readOnly: boolean): void {
    this._readOnly = readOnly
  }

  /**
   * Gets all of the log rows
   *
   * @return  {Promise<LogRow[]>}  All of the stored log rows
   */
  async getRows(): Promise<LogRow[]> {
    const dataAsString = await this.storage.getItem(StringifyDataWriter.STORAGEKEY)
    if (!dataAsString) {
      return []
    }
    const rows = JSON.parse(dataAsString)
    rows.forEach((row: LogRow) => {
      row.timeStamp = moment(row.timeStamp)
    })
    return rows
  }

  /**
   * Inserts new Low Rows
   *
   * @param   {LogRow[]}  logRows  The new LogRows to insert
   * @param   {LogRow[]}  allRows  All of the existing LogRows?
   *
   * @return  {Promise<LogRow[]>}           Echo the provided LogRows
   */
  async insertRows(logRows: LogRow[] = [], allRows: LogRow[]): Promise<LogRow[]> {
    if (this._readOnly) {
      return logRows
    }
    await this.storage.setItem(StringifyDataWriter.STORAGEKEY, JSON.stringify(allRows))
    return logRows
  }

  /**
   * Clears all of the stored LogRows
   *
   * @return  {Promise<void>}
   */
  async clear(): Promise<void> {
    await this.storage.removeItem(StringifyDataWriter.STORAGEKEY)
  }

  /**
   * Does nothing on this class
   *
   * @return  {void}
   */
  logRowCreated(logRow: LogRow): void {
    // console.log('[Stringify-Data-Writer] - [logRowCreated] - This method is not implemented', logRow)
  }

  /**
   * Does nothing on this class
   *
   * @param   {LogRow}  logRow  A Log Row
   *
   * @return  {LogRow}          Echo the Log Row
   */
  appendToLogRow(logRow: LogRow): LogRow {
    return logRow
  }

  /**
   * Does nothing on this class
   *
   * @param   {LogRow[]}  logRows  Some Log Rows
   *
   * @return  {Promise<void>}
   */
  async initalDataRead(logRows: LogRow[]): Promise<void> {
    // console.log('[Stringify-Data-Writer] - [initialDataRead] - This method is not implemented')
  }
}
