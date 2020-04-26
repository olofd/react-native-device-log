import BaseDataWriter from './BaseDataWriter';
import LogRow from '../LogRow';
/**
 * Stores LogRows as JSON in the provided storage
 */
export default class StringifyDataWriter implements BaseDataWriter {
    static STORAGEKEY: string;
    _readOnly: boolean;
    storage: any;
    get readOnly(): boolean;
    /**
     * Creates a new instance of the StringifyDataWriter
     *
     * @param   {any}  storage  Somewhere to store the LogRows
     */
    constructor(storage: any);
    /**
     * Sets the read only mode
     *
     * @param   {boolean}  readOnly  The new readOnly mode
     *
     * @return  {void}
     */
    setReadOnly(readOnly: boolean): void;
    /**
     * Gets all of the log rows
     *
     * @return  {Promise<LogRow[]>}  All of the stored log rows
     */
    getRows(): Promise<LogRow[]>;
    /**
     * Inserts new Low Rows
     *
     * @param   {LogRow[]}  logRows  The new LogRows to insert
     * @param   {LogRow[]}  allRows  All of the existing LogRows?
     *
     * @return  {Promise<LogRow[]>}           Echo the provided LogRows
     */
    insertRows(logRows: LogRow[], allRows: LogRow[]): Promise<LogRow[]>;
    /**
     * Clears all of the stored LogRows
     *
     * @return  {Promise<void>}
     */
    clear(): Promise<void>;
    /**
     * Does nothing on this class
     *
     * @return  {void}
     */
    logRowCreated(logRow: LogRow): void;
    /**
     * Does nothing on this class
     *
     * @param   {LogRow}  logRow  A Log Row
     *
     * @return  {LogRow}          Echo the Log Row
     */
    appendToLogRow(logRow: LogRow): LogRow;
    /**
     * Does nothing on this class
     *
     * @param   {LogRow[]}  logRows  Some Log Rows
     *
     * @return  {Promise<void>}
     */
    initalDataRead(logRows: LogRow[]): Promise<void>;
}
