import moment from "moment";

export const RealmBaseScheme = {
    name: "LogRow",
    properties: {
        id: "string",
        lengthAtInsertion: "int",
        level: "string",
        message: "string",
        _timeStamp: "date",
        color: "string",
    },
};
export default class RealmDataWriter {
    constructor(realm) {
        this._readOnly = true;
        this.realm = realm;
    }

    setReadOnly(readOnly) {
        this._readOnly = readOnly;
    }

    async insertRows(rows, allRows) {
        if (this._readOnly) {
            return rows;
        }
        return await new Promise((resolve, reject) => {
            this.realm.write(() => {
                rows.map(row => {
                    this.realm.create("LogRow", {
                        ...row,
                        _timeStamp: row.timeStamp.toDate(),
                    });
                });
                return resolve(rows);
            });
        });
    }

    async getRows() {
        const realmRows = this.realm.objects("LogRow");
        return realmRows.slice(0, realmRows.length).map(row => {
            row.timeStamp = moment(row._timeStamp);
            return row;
        });
    }

    //Required
    async clear() {
        return this.realm.write(() => {
            let allRows = this.realm.objects("LogRow");
            return this.realm.delete(allRows);
        });
    }

    //Optional
    logRowCreated(logRow) {}

    //Optional
    appendToLogRow(logRow) {
        return logRow;
    }

    //Optional
    async initalDataRead(logRows) {}
}
