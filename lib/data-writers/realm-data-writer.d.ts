import LogRow from '../LogRow';
import BaseDataWriter from './BaseDataWriter';
export declare const RealmBaseScheme: {
    name: string;
    properties: {
        id: string;
        lengthAtInsertion: string;
        level: string;
        message: string;
        _timeStamp: string;
        color: string;
    };
};
/**
 * Stores log rows in a Realm Database
 */
export default class RealmDataWriter implements BaseDataWriter {
    _readOnly: boolean;
    realm: any;
    get readOnly(): boolean;
    /**
     * Create a new instance of the Realm Data Writer
     *
     * @param   {Realm}  realm  Realm database used for storage
     *
     */
    constructor(realm: any);
    setReadOnly(readOnly: boolean): void;
    /**
     * If the data writer is not in read only mode
     * inserts the provided rows into the database
     *
     * @param   {LogRow[]}  rows     The rows to be added to the database
     * @param   {LogRow[]}  allRows  The existing rows
     *
     * @return  {Promise<LogRow[]>}           Echo the provided rows
     */
    insertRows(rows: LogRow[], allRows: LogRow[]): Promise<LogRow[]>;
    /**
     * Gets all of the existing log rows
     *
     * @return  {Promise<LogRow[]>}  The retrieved LogRows
     */
    getRows(): Promise<any>;
    /**
     * Clear the stored LogRows
     *
     * @return  {Promise<void>}
     */
    clear(): Promise<any>;
    /**
     * Does nothing on this class
     *
     * @param   {LogRow}  logRow  A LogRow
     *
     * @return  {void}
     */
    logRowCreated(logRow: LogRow): void;
    /**
     * Does nothing on this class
     *
     * @param   {LogRow}  logRow  A LogRow
     *
     * @return  {LogRow}          Echo the provided LogRow
     */
    appendToLogRow(logRow: LogRow): LogRow;
    /**
     * Does nothing on this class
     *
     * @param   {LogRow[]}  logRows  Some LogRows
     *
     * @return  {Promise<void>}
     */
    initalDataRead(logRows: LogRow[]): Promise<void>;
}
