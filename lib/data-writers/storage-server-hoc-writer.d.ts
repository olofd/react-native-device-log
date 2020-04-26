import moment from 'moment';
import LogRow from '../LogRow';
import BaseDataWriter from './BaseDataWriter';
declare class SentRow {
    id: string;
    success?: boolean;
    sendTimeStamp?: any;
    constructor(id: string);
}
declare type StorageServerHocWriterOptions = {
    serverUrl?: string;
    getExtraData?: Function;
    modifyRowBeforeSend?: Function;
    appendToLogRow(logRow: LogRow): LogRow;
    skipSendingMessagesOlderThen?: moment.Moment;
    sendInterval: number;
    batchSize: number;
    isDebug: boolean;
    sendLevels: string[];
    serializeData?: Function;
};
/**
 * @typedef {Object} RowTuple
 * @property {LogRow[]} rowsToSend - The LogRows to send to the server
 * @property {SentRow[]} sentToServerRows - The Rows already sent to the server
 */
declare type RowTuple = {
    rowsToSend: LogRow[];
    sentToServerRows: SentRow[];
};
/**
 * A Data Writer that will ship logs to a server?
 */
export default class StorageServerHocWriter implements BaseDataWriter {
    static SERVER_SEND_STORAGE_KEY: string;
    sendQueue: LogRow[];
    writer: BaseDataWriter;
    options: StorageServerHocWriterOptions;
    sentToServerRows: SentRow[];
    initPromise: Promise<SentRow[]>;
    initalRowFetchPromise?: Promise<LogRow[]>;
    initalSendToServerPromise?: Promise<LogRow[]>;
    get readOnly(): boolean;
    /**
     * Creates a new instance of StorageServerHocWriter
     *
     * @param   {any}  writer   The Data Writer to persist the Log Rows
     * @param   {StorageServerHocWriterOptions}  options  A set of options for the storage
     *
     */
    constructor(writer?: BaseDataWriter, options?: StorageServerHocWriterOptions);
    logRowCreated(logRow: LogRow): void;
    appendToLogRow(logRow: LogRow): LogRow;
    initalDataRead(logRows: LogRow[]): void;
    /**
     * Sets the readOnly flag
     *
     * @param   {boolean}  readOnly  The new readOnly status
     *
     * @return  {void}
     */
    setReadOnly(readOnly: boolean): void;
    /**
     * Gets LogRows from the storage writer
     *
     * @return  {Promise<LogRow[]>}  The retrieved LogRows
     */
    getRows(): Promise<LogRow[]>;
    /**
     * Inserts new LogRows or return the provided LogRows if in ReadOnly mode
     *
     * @param   {LogRow[]}  logRows  New LogRows to insert
     * @param   {LogRow[]}  allRows  The existing LogRows
     *
     * @return  {Promise<LogRow[]>}           Some LogRows
     */
    insertRows(logRows: LogRow[], allRows: LogRow[]): Promise<LogRow[]>;
    /**
     * Removes all LogRows
     *
     * @return  {Promise<void>}
     */
    clear(): Promise<void>;
    /**
     * Filter out LogRows that have been removed
     *
     * @param   {LogRow[]}  logRows  LogRows to remove
     *
     * @return  {Promise<LogRow[]>}           Echo the proivded LogRows
     */
    filterRemoved(logRows: LogRow[]): Promise<LogRow[]>;
    /**
     * Periodically attempts to send LogRows to the configured server
     *
     * @return  {Promise<void>}
     */
    sendToServerLoop(): Promise<void>;
    /**
     * Flush the send queue to the server
     *
     * @return  {Promise<void>}
     */
    sendAllMessagesToServer(): Promise<void>;
    /**
     * Sends a batch of LogRows to a server
     *
     * @param   {number}  batchSize  The number of LogRows to send in each batch
     *
     * @return  {Promise<LogRow[]>}             The remaining LogRows to send to the server
     */
    sendToServer(batchSize: number): Promise<LogRow[]>;
    /**
     * Removes a LogRow from the sendQueue
     *
     * @param   {LogRow}  row  The LogRow to remove
     *
     * @return  {void}
     */
    removeFromSendQueue(row: LogRow): void;
    /**
     * Creates an array of LogRows that will be sent to the server
     *
     * @param   {number}  batchSize  The number of LogRows to send
     *
     * @return  {RowTuple}             The LogRows that are ready to send to the server
     */
    getPostData(batchSize: number): RowTuple;
    /**
     * Determines if the LogRow should be queued for sending to the server
     * Filters out LogRows that are too old
     *
     * @param   {LogRow}  logRow            LogRow for consideration
     * @param   {SentRow[]}  sentToServerRows  The LogRows that have been sent to the server
     *
     * @return  {boolean}                    The decision of whether the LogRow should be sent or not
     */
    shouldAppendRowToQueue(logRow: LogRow, sentToServerRows: SentRow[]): boolean;
    /**
     * Checks to see if the LogRow has a Log Level that should be included
     *
     * @param   {LogRow}  logRow  LogRow to be checked
     *
     * @return  {boolean}          Decision for if the LogRow should be included
     */
    includedLevel(logRow: LogRow): boolean;
    /**
     * Adds LogRows to the sendQueue
     *
     * @param   {LogRow[]}  logRows  LogRows to add to the sendQueue
     *
     * @return  {void}
     */
    addToQueue(logRows: LogRow[]): void;
    /**
     * Log to the console
     *
     * @param   {any[]}  args  The args to forward to console.log
     *
     * @return  {void}
     */
    log(...args: [any?, ...any[]]): void;
    /**
     * Gets the LogRows that have been sent to the server
     *
     * @return  {Promise<SentRow[]>}  The sent LogRows
     */
    getSentToServerRows(): Promise<SentRow[]>;
    /**
     * Sets the LogRows that have been sent to the server
     *
     * @param   {SentRow[]}  sentToServerRows  The LogRows that have been sent to the server
     *
     * @return  {Promise<SentRow[]>}                    Echo the sent LogRows
     */
    setSentToServerRows(sentToServerRows: SentRow[]): Promise<SentRow[]>;
}
export {};
