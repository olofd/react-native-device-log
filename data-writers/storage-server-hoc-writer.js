import { AsyncStorage } from "react-native";
import StringifyDataWriter from "./stringify-data-writer";
import moment from "moment";

export default class StorageServerHocWriter {
    static SERVER_SEND_STORAGE_KEY = "debug-rows-SERVER_SEND_STORAGE_KEY";
    constructor(writer, options) {
        this.writer = writer || new StringifyDataWriter(AsyncStorage);
        this.options = {
            appendToLogRow: logRow => logRow,
            skipSendingMessagesOlderThen: null,
            sendInterval: 10000,
            batchSize: 30,
        };
        this.options = { ...this.options, ...options };
        this.sentToServerRows = null;
        this.initPromise = this.getSentToServerRows().then(rows => {
            this.sentToServerRows = rows;
            return rows;
        });
    }

    setReadOnly(readOnly) {
        this.writer.setReadOnly(readOnly);
    }
    //Required
    async getRows() {
        if (!this.initalRowFetchPromise) {
            this.initalRowFetchPromise = this.writer.getRows();
            const logRows = await this.initalRowFetchPromise;
            await this.filterRemoved(logRows);
            const logRowsToSend = logRows.filter(logRow =>
                this.shouldAppendRowToQueue(logRow, this.sentToServerRows)
            );
            this.addToQueue(logRowsToSend);
            this.sendToServerLoop();
            return logRows;
        }
        return await this.writer.getRows();
    }

    async insertRows(logRows = [], allRows) {
        const rows = await this.writer.insertRows(logRows, allRows);
        await this.initPromise;
        this.addToQueue(
            logRows.filter(logRow =>
                this.shouldAppendRowToQueue(logRow, this.sentToServerRows)
            )
        );
        return rows;
    }

    //Required
    async clear() {
        await AsyncStorage.removeItem(
            StorageServerHocWriter.SERVER_SEND_STORAGE_KEY
        );
        await this.writer.clear();
    }

    async logRowCreated(logRow) {}

    async filterRemoved(logRows) {
        await this.initPromise;
        if (this.sentToServerRows) {
            this.sentToServerRows = this.sentToServerRows.filter(sentRow =>
                logRows.some(row => row.id === sentRow.id)
            );
            await this.setSentToServerRows(this.sentToServerRows);
        }
        return logRows;
    }

    appendToLogRow(logRow) {
        return this.options.appendToLogRow(logRow);
    }

    async sendToServerLoop() {
        if (!this.initalSendToServerPromise) {
            try {
                this.initalSendToServerPromise = await this.sendToServer();
            } catch (err) {
            } finally {
                setTimeout(() => {
                    this.sendToServerLoop();
                }, this.options.sendInterval);
            }
        }
    }

    async sendAllMessagesToServer() {}

    async sendToServer() {
        const { rowsToSend, sentToServerRows } = await this.getPostData();
        if (rowsToSend && rowsToSend.length) {
            try {
                const response = await fetch(this.options.serverUrl, {
                    method: "POST",
                    body: JSON.stringify(rowsToSend),
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) {
                    console.log(response);
                    throw new Error("Failed sending logRows to server");
                }
                sentToServerRows.forEach(row => (row.success = true));
                rowsToSend.forEach(row => this.removeFromSendQueue(row));
            } catch (err) {
                throw err;
            } finally {
                await this.setSentToServerRows(this.sentToServerRows);
            }
        }
    }

    removeFromSendQueue(row) {
        const rowIndex = this.sendQueue.indexOf(row);
        if (rowIndex !== -1) {
            this.sendQueue.splice(rowIndex, 1);
        }
    }

    getPostData() {
        if (this.sendQueue && this.sendQueue.length) {
            const rowsToSend = this.sendQueue.slice(0, this.options.batchSize);
            if (rowsToSend && rowsToSend.length) {
                let sentToServerRows = rowsToSend.map(rowToSend => {
                    let sentToServerRow = this.sentToServerRows.find(
                        row => row.id === rowToSend.id
                    );
                    if (!sentToServerRow) {
                        sentToServerRow = {
                            id: rowToSend.id,
                            success: false,
                        };
                        this.sentToServerRows.push(sentToServerRow);
                    }
                    sentToServerRow.sendTimeStamp = moment();
                    return sentToServerRow;
                });
                return { rowsToSend, sentToServerRows };
            }
        }
        return [];
    }

    shouldAppendRowToQueue(logRow, sentToServerRows) {
        if (
            this.options.skipSendingMessagesOlderThen &&
            logRow.timeStamp < this.options.skipSendingMessagesOlderThen
        ) {
            return false;
        }
        const foundRow = sentToServerRows.find(
            serverRow => serverRow.id === logRow.id
        );

        if (!foundRow) {
            return true;
        }
        const minutesSinceSent = moment
            .duration(moment().diff(foundRow.sendTimeStamp))
            .asMinutes();
        return !foundRow.success && minutesSinceSent > 3;
    }

    addToQueue(logRows) {
        if (logRows && logRows.length) {
            this.sendQueue = this.sendQueue || [];
            this.sendQueue = this.sendQueue.concat(logRows);
        }
    }

    async getSentToServerRows() {
        const rowsString = await AsyncStorage.getItem(
            StorageServerHocWriter.SERVER_SEND_STORAGE_KEY
        );
        if (rowsString) {
            return JSON.parse(rowsString);
        }
        return await this.setSentToServerRows([]);
    }

    async setSentToServerRows(sentToServerRows) {
        await AsyncStorage.setItem(
            StorageServerHocWriter.SERVER_SEND_STORAGE_KEY,
            JSON.stringify(sentToServerRows || [])
        );
        return sentToServerRows;
    }
}
