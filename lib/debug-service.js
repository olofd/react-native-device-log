import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { ErrorUtils } from 'react-native';
import moment from 'moment';
import InMemory from './adapters/in-memory';
import timers from './timers';
import debounce from 'debounce';
import stacktraceParser from 'stacktrace-parser';
import stringify from 'json-stringify-safe';
import StringifyDataWriter from './data-writers/stringify-data-writer';
import uuid from 'uuid';
import colors from './colors';
import LogRow from './LogRow';
const APP_START_LOG_MESSAGE = new LogRow(uuid.v4(), 0, 'seperator', 'APP START', moment(), '#FFF');
class DebugService {
    constructor(options) {
        options = options || {};
        options.colors = options.colors || {};
        options.colors = { ...colors, ...options.colors };
        this.logRows = [];
        this.store = new StringifyDataWriter(new InMemory());
        this.listners = [];
        this.options = {
            logToConsole: false,
            logToConsoleMethod: 'match',
            logToConsoleFunc: undefined,
            logRNErrors: false,
            maxNumberToRender: 0,
            maxNumberToPersist: 0,
            rowInsertDebounceMs: 200,
            logAppState: true,
            logConnection: true,
            ...options,
        };
        this.appStartRendered = false;
        this.connectionHasBeenEstablished = false;
        this.hasBeenDisconnected = false;
    }
    _handleConnectivityTypeChange(connectionInfo) {
        const { type } = connectionInfo;
        if (type === 'none') {
            this.hasBeenDisconnected = true;
            this.seperator(`DISCONNECTED FROM INTERNET`);
        }
        else {
            if (this.hasBeenDisconnected) {
                this.seperator(`[NETINFO] RECONNECTED TO ${type}`);
            }
            else {
                if (this.connectionHasBeenEstablished) {
                    this.seperator(`[NETINFO] CHANGED TO ${type}`);
                }
                else {
                    this.seperator(`[NETINFO] CONNECTION TO ${type}`);
                }
            }
        }
        this.connectionHasBeenEstablished = true;
    }
    _handleAppStateChange(currentAppState) {
        this.seperator(`APP STATE: ${currentAppState.toUpperCase()}`);
    }
    setupRNErrorLogging() {
        if (ErrorUtils) {
            const defaultHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();
            if (defaultHandler) {
                const parseErrorStack = (error) => {
                    if (!error || !error.stack) {
                        return [];
                    }
                    return Array.isArray(error.stack) ? error.stack : stacktraceParser.parse(error.stack);
                };
                ErrorUtils.setGlobalHandler((error, isFatal) => {
                    const stack = parseErrorStack(error);
                    this.rnerror(isFatal, error.message, stack);
                    defaultHandler && defaultHandler(error, isFatal);
                });
            }
        }
    }
    async init(storageAdapter, options) {
        options.colors = options.colors || {};
        options.colors = { ...colors, ...options.colors };
        this.options = {
            ...this.options,
            ...options,
        };
        if (this.options.customDataWriter) {
            this.store = this.options.customDataWriter;
        }
        else {
            this.store = new StringifyDataWriter(storageAdapter || new InMemory());
        }
        if (this.options.logAppState) {
            AppState.addEventListener('change', this._handleAppStateChange.bind(this));
        }
        if (this.options.logConnection) {
            NetInfo.addEventListener(this._handleConnectivityTypeChange.bind(this));
        }
        if (this.options.logRNErrors) {
            this.setupRNErrorLogging();
        }
        this._initalGet();
        return this.insertAppStartMessage();
    }
    async insertAppStartMessage() {
        if (!this.appStartRendered) {
            this.appStartRendered = true;
            await this._appendToLog([APP_START_LOG_MESSAGE]);
        }
    }
    async insertStoreRows(rows) {
        if (this.store.readOnly) {
            return;
        }
        this.rowsToInsert = this.rowsToInsert || [];
        this.rowsToInsert = this.rowsToInsert.concat(rows);
        if (!this.debouncedInsert) {
            this.debouncedInsert = debounce(() => {
                if (this.store && this.store.insertRows) {
                    const insertArray = this.rowsToInsert;
                    this.rowsToInsert = [];
                    return this.store.insertRows(insertArray, this.getEmittableData(this.logRows));
                }
            }, this.options.rowInsertDebounceMs);
        }
        if (this.debouncedInsert) {
            this.debouncedInsert();
        }
    }
    async _initalGet() {
        this.initPromise = this.store.getRows();
        const rows = await this.initPromise;
        this.store.setReadOnly(false);
        const newRows = this.logRows;
        this.logRows = this.logRows.concat(rows);
        this.sortLogRows();
        await this.insertStoreRows(newRows);
        if (this.store.initalDataRead) {
            await this.store.initalDataRead(this.logRows);
        }
        return this.emitDebugRowsChanged(this.logRows);
    }
    sortLogRows() {
        this.logRows.sort((left, right) => {
            const dateDiff = moment.utc(right.timeStamp).diff(moment.utc(left.timeStamp));
            if (dateDiff === 0) {
                return right.lengthAtInsertion - left.lengthAtInsertion;
            }
            return dateDiff;
        });
    }
    async _getAndEmit() {
        const rows = await this.store.getRows();
        return this.emitDebugRowsChanged(rows);
    }
    stopTimer(name) {
        timers.stop(name);
        timers.remove(name);
    }
    async startTimer(name) {
        const timer = timers.start(name);
        return await this._log('start-timer', undefined, name);
    }
    async logTime(name) {
        const timer = timers.stop(name);
        return await this._log('end-timer', undefined, `${name}-timer delta:  ${timer.delta}ms`);
    }
    async clear() {
        this.logRows = [];
        await this.store.clear();
        return await this._getAndEmit();
    }
    log(...logRows) {
        return this._log('log', undefined, ...logRows);
    }
    debug(...logRows) {
        return this._log('debug', undefined, ...logRows);
    }
    info(...logRows) {
        return this._log('info', undefined, ...logRows);
    }
    error(...logRows) {
        return this._log('error', undefined, ...logRows);
    }
    fatal(...logRows) {
        return this._log('fatal', undefined, ...logRows);
    }
    success(...logRows) {
        return this._log('success', undefined, ...logRows);
    }
    rnerror(fatal, message, stackTrace) {
        let errorString = `ERROR: ${message}  \nSTACKSTRACE:\n`;
        if (stackTrace && Array.isArray(stackTrace)) {
            const stackStrings = stackTrace.map((stackTraceItem) => {
                let methodName = '-';
                let lineNumber = '-';
                let column = '-';
                if (stackTraceItem.methodName) {
                    methodName = stackTraceItem.methodName === '<unknown>' ? '-' : stackTraceItem.methodName;
                }
                if (stackTraceItem.lineNumber !== undefined) {
                    lineNumber = stackTraceItem.lineNumber.toString();
                }
                if (stackTraceItem.column !== undefined) {
                    column = stackTraceItem.column.toString();
                }
                return `Method: ${methodName}, LineNumber: ${lineNumber}, Column: ${column}\n`;
            });
            errorString += stackStrings.join('\n');
        }
        if (fatal) {
            return this._log('RNFatal', undefined, errorString);
        }
        else {
            return this._log('RNError', undefined, errorString);
        }
    }
    seperator(name) {
        return this._log('seperator', undefined, name);
    }
    getColorForLogLevel(level) {
        return this.options.colors[level] || '#fff';
    }
    async _log(level, options, ...logRows) {
        let color = this.getColorForLogLevel(level);
        if (options) {
            if (options.color) {
                color = options.color;
            }
        }
        this.logToConsole(level, color, ...logRows);
        let formattedRows = logRows.map((logRow, idx) => new LogRow(uuid.v4(), this.logRows.length + idx, level, this._parseDataToString(logRow), moment(), color));
        if (this.options && this.options.appendToLogRow) {
            formattedRows = formattedRows.map((logRow) => this.options.appendToLogRow(logRow));
        }
        if (!this.logRows.length) {
            await this.insertAppStartMessage();
        }
        if (this.store.logRowCreated) {
            formattedRows.forEach((logRow) => this.store.logRowCreated(logRow));
        }
        await this._appendToLog(formattedRows);
        if (!this.initPromise) {
            await this._initalGet();
        }
    }
    logToConsole(level, color, ...logRows) {
        if (this.options.logToConsole &&
            (!this.options.disableLevelToConsole ||
                !this.options.disableLevelToConsole.some((disabledLevel) => disabledLevel === level))) {
            if (this.options.logToConsoleFunc) {
                this.options.logToConsoleFunc(level, color, logRows);
            }
            else {
                if (this.options.logToConsoleMethod === 'match') {
                    const avaliableConsoleLogs = ['log', 'info', 'debug', 'error'];
                    const consoleLogFunc = avaliableConsoleLogs.find((avCL) => avCL === level) || 'log';
                    console[consoleLogFunc](...logRows);
                }
                else if (this.options.logToConsoleMethod) {
                    console[this.options.logToConsoleMethod](...logRows);
                }
            }
        }
    }
    _parseDataToString(data) {
        if (typeof data === 'string' || data instanceof String) {
            return data.toString();
        }
        else {
            let dataAsString = stringify(data, null, '  '); //FYI: spaces > tabs
            if (dataAsString && dataAsString.length > 12000) {
                dataAsString = dataAsString.substring(0, 12000) + '...(Cannot display more RN-device-log)';
            }
            return dataAsString;
        }
    }
    async _appendToLog(logRows) {
        this.logRows = logRows.concat(this.logRows);
        await this.insertStoreRows(logRows);
        this.emitDebugRowsChanged(this.logRows);
    }
    onDebugRowsChanged(cb) {
        this.listners.push(cb);
        cb(this.getEmittableData(this.logRows));
        return () => {
            const i = this.listners.indexOf(cb);
            if (i !== -1) {
                this.listners.splice(i, 1);
            }
        };
    }
    emitDebugRowsChanged(data) {
        this.listners.forEach((cb) => cb(this.getEmittableData(data)));
    }
    getEmittableData(rows) {
        if (this.options.maxNumberToRender !== 0) {
            return rows.slice(0, this.options.maxNumberToRender);
        }
        return rows;
    }
}
export default new DebugService();
