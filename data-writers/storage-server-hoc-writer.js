import { AsyncStorage } from "react-native";
import StringifyDataWriter from "./stringify-data-writer";
import moment from "moment";

export default class StorageServerHocWriter {
    static SERVER_SEND_STORAGE_KEY = "debug-rows-SERVER_SEND_STORAGE_KEY";
    constructor(writer, options) {
        this.writer = writer || new StringifyDataWriter(AsyncStorage);
        this.options = {
            serverUrl: null,
            getExtraData: () => null,
            modifyRowBeforeSend: null,
            appendToLogRow: logRow => logRow,
            skipSendingMessagesOlderThen: null,
            sendInterval: 10000,
            batchSize: 30,
            isDebug: true,
            sendLevels: ["all"],
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
            await this.initPromise;
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
        if (this.readOnly) {
            return logRows;
        }
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
        this.sendQueue = [];
        this.sentToServerRows = [];
        await this.writer.clear();
    }

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

    async sendToServerLoop() {
        if (!this.initalSendToServerPromise && this.options.sendInterval) {
            try {
                this.initalSendToServerPromise = await this.sendToServer(
                    this.options.batchSize
                );
            } catch (err) {
                this.log(
                    "[StorageServerHocWriter] error while sending clientLog to server",
                    err
                );
            } finally {
                setTimeout(() => {
                    this.sendToServerLoop();
                }, this.options.sendInterval);
            }
        }
    }

    async sendAllMessagesToServer() {
        await this.initPromise;
        await this.initalRowFetchPromise;
        await this.sendToServer(this.sendQueue.length);
    }

    async sendToServer(batchSize) {
        const { rowsToSend, sentToServerRows } = await this.getPostData(
            batchSize
        );
        if (!this.options.serverUrl) {
            throw new Error(
                "You need to supply an serverUrl option to StorageServerHocWriter"
            );
        }
        if (rowsToSend && rowsToSend.length) {
            try {
                const data = {
                    rows: this.options.modifyRowBeforeSend
                        ? rowsToSend.map(row =>
                              this.options.modifyRowBeforeSend(row)
                          )
                        : rowsToSend,
                    extraData: this.options.getExtraData(),
                };
                this.log(`Sending ${rowsToSend.length} log-rows to server`);
                const response = await fetch(this.options.serverUrl, {
                    method: "POST",
                    body: this.options.serializeData
                        ? this.options.serializeData(data)
                        : JSON.stringify(data),
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) {
                    this.log(response);
                    throw new Error("Failed sending logRows to server");
                }
                sentToServerRows.forEach(row => (row.success = true));
                rowsToSend.forEach(row => this.removeFromSendQueue(row));
                return rowsToSend;
            } finally {
                await this.setSentToServerRows(this.sentToServerRows);
            }
        }
        return [];
    }

    removeFromSendQueue(row) {
        const rowIndex = this.sendQueue.indexOf(row);
        if (rowIndex !== -1) {
            this.sendQueue.splice(rowIndex, 1);
        }
    }

    getPostData(batchSize) {
        if (this.sendQueue && this.sendQueue.length) {
            const rowsToSend = this.sendQueue.slice(0, batchSize);
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
        if (!this.includedLevel(logRow)) {
            return false;
        }
        const foundRow = sentToServerRows.find(
            serverRow => serverRow.id === logRow.id
        );
        const shouldAddToQueue = !foundRow || !foundRow.success;
        return shouldAddToQueue;
    }

    includedLevel(logRow) {
        return (
            this.options.sendLevels.indexOf("all") !== -1 ||
            this.options.sendLevels.indexOf(logRow.level) !== -1
        );
    }

    addToQueue(logRows) {
        if (logRows && logRows.length) {
            this.sendQueue = this.sendQueue || [];
            this.sendQueue = this.sendQueue.concat(logRows);
        }
    }

    log(...args) {
        if (this.options.isDebug) {
            console.log.apply(console, args);
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
