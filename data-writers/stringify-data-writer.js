import moment from "moment";

export default class StringifyDataWriter {
    static STORAGEKEY = "debug-rows";

    constructor(storage) {
        this._readOnly = true;
        this.storage = storage;
    }

    setReadOnly(readOnly) {
        this._readOnly = readOnly;
    }

    //Required
    async getRows() {
        let dataAsString = await this.storage.getItem(
            StringifyDataWriter.STORAGEKEY
        );
        if (!dataAsString) {
            return [];
        }
        let rows = JSON.parse(dataAsString);
        rows.forEach(row => {
            row.timeStamp = moment(row.timeStamp);
        });
        return rows;
    }

    async insertRows(logRows = [], allRows) {
        if (this._readOnly) {
            return logRows;
        }
        await this.storage.setItem(
            StringifyDataWriter.STORAGEKEY,
            JSON.stringify(allRows)
        );
        return logRows;
    }

    //Required
    async clear() {
        await this.storage.removeItem(StringifyDataWriter.STORAGEKEY);
    }

    //Optional
    logRowCreated() {}

    //Optional
    appendToLogRow(logRow) {
        return logRow;
    }

    //Optional
    async initalDataRead(logRows) {}
}
