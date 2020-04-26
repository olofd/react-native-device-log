import moment from 'moment';
/**
 * Stores LogRows as JSON in the provided storage
 */
export default class StringifyDataWriter {
    /**
     * Creates a new instance of the StringifyDataWriter
     *
     * @param   {any}  storage  Somewhere to store the LogRows
     */
    constructor(storage) {
        this._readOnly = true;
        this.storage = storage;
    }
    get readOnly() {
        return this._readOnly;
    }
    /**
     * Sets the read only mode
     *
     * @param   {boolean}  readOnly  The new readOnly mode
     *
     * @return  {void}
     */
    setReadOnly(readOnly) {
        this._readOnly = readOnly;
    }
    /**
     * Gets all of the log rows
     *
     * @return  {Promise<LogRow[]>}  All of the stored log rows
     */
    async getRows() {
        const dataAsString = await this.storage.getItem(StringifyDataWriter.STORAGEKEY);
        if (!dataAsString) {
            return [];
        }
        const rows = JSON.parse(dataAsString);
        rows.forEach((row) => {
            row.timeStamp = moment(row.timeStamp);
        });
        return rows;
    }
    /**
     * Inserts new Low Rows
     *
     * @param   {LogRow[]}  logRows  The new LogRows to insert
     * @param   {LogRow[]}  allRows  All of the existing LogRows?
     *
     * @return  {Promise<LogRow[]>}           Echo the provided LogRows
     */
    async insertRows(logRows = [], allRows) {
        if (this._readOnly) {
            return logRows;
        }
        await this.storage.setItem(StringifyDataWriter.STORAGEKEY, JSON.stringify(allRows));
        return logRows;
    }
    /**
     * Clears all of the stored LogRows
     *
     * @return  {Promise<void>}
     */
    async clear() {
        await this.storage.removeItem(StringifyDataWriter.STORAGEKEY);
    }
    /**
     * Does nothing on this class
     *
     * @return  {void}
     */
    logRowCreated(logRow) {
        // console.log('[Stringify-Data-Writer] - [logRowCreated] - This method is not implemented', logRow)
    }
    /**
     * Does nothing on this class
     *
     * @param   {LogRow}  logRow  A Log Row
     *
     * @return  {LogRow}          Echo the Log Row
     */
    appendToLogRow(logRow) {
        return logRow;
    }
    /**
     * Does nothing on this class
     *
     * @param   {LogRow[]}  logRows  Some Log Rows
     *
     * @return  {Promise<void>}
     */
    async initalDataRead(logRows) {
        // console.log('[Stringify-Data-Writer] - [initialDataRead] - This method is not implemented')
    }
}
StringifyDataWriter.STORAGEKEY = 'debug-rows';
