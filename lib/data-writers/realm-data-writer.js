import moment from 'moment';
export const RealmBaseScheme = {
    name: 'LogRow',
    properties: {
        id: 'string',
        lengthAtInsertion: 'int',
        level: 'string',
        message: 'string',
        _timeStamp: 'date',
        color: 'string',
    },
};
/**
 * Stores log rows in a Realm Database
 */
export default class RealmDataWriter {
    /**
     * Create a new instance of the Realm Data Writer
     *
     * @param   {Realm}  realm  Realm database used for storage
     *
     */
    constructor(realm) {
        this._readOnly = true;
        this.realm = realm;
    }
    get readOnly() {
        return this._readOnly;
    }
    setReadOnly(readOnly) {
        this._readOnly = readOnly;
    }
    /**
     * If the data writer is not in read only mode
     * inserts the provided rows into the database
     *
     * @param   {LogRow[]}  rows     The rows to be added to the database
     * @param   {LogRow[]}  allRows  The existing rows
     *
     * @return  {Promise<LogRow[]>}           Echo the provided rows
     */
    async insertRows(rows, allRows) {
        if (this._readOnly) {
            return rows;
        }
        return await new Promise((resolve, reject) => {
            this.realm.write(() => {
                rows.map((row) => {
                    this.realm.create('LogRow', {
                        ...row,
                        _timeStamp: row.timeStamp.toDate(),
                    });
                });
                return resolve(rows);
            });
        });
    }
    /**
     * Gets all of the existing log rows
     *
     * @return  {Promise<LogRow[]>}  The retrieved LogRows
     */
    async getRows() {
        const realmRows = this.realm.objects('LogRow');
        return realmRows.slice(0, realmRows.length).map((row) => {
            row.timeStamp = moment(row._timeStamp);
            return row;
        });
    }
    /**
     * Clear the stored LogRows
     *
     * @return  {Promise<void>}
     */
    async clear() {
        return this.realm.write(() => {
            const allRows = this.realm.objects('LogRow');
            return this.realm.delete(allRows);
        });
    }
    /**
     * Does nothing on this class
     *
     * @param   {LogRow}  logRow  A LogRow
     *
     * @return  {void}
     */
    logRowCreated(logRow) { }
    /**
     * Does nothing on this class
     *
     * @param   {LogRow}  logRow  A LogRow
     *
     * @return  {LogRow}          Echo the provided LogRow
     */
    appendToLogRow(logRow) {
        return logRow;
    }
    /**
     * Does nothing on this class
     *
     * @param   {LogRow[]}  logRows  Some LogRows
     *
     * @return  {Promise<void>}
     */
    async initalDataRead(logRows) { }
}
