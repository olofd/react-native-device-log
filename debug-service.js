import {AsyncStorage, AppState, NetInfo} from 'react-native';
import moment from 'moment';
import InMemory from './adapters/in-memory';
import timers from './timers';
import debounce from 'debounce';
import stacktraceParser from 'stacktrace-parser';
import stringify from 'json-stringify-safe';

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
const APP_START_LOG_MESSAGE = {
  id: guid(),
  lengthAtInsertion: 0,
  level: 'seperator',
  message: 'APP START',
  timeStamp: moment(),
  color: '#FFF'
};

class DebugService {
  static STORAGEKEY = "debug-rows";
  constructor() {
    this.previousConnectionTypes = [];
    this.logData = {
      rows: []
    };
    this.storage = new InMemory();
    this.listners = [];
    this.options = {
      logToConsole: true,
      logRNErrors: false,
      maxNumberToRender: 0,
      maxNumberToPersist: 0
    };
    this._initalGetIsResolved = false;
    this._saveLogDataDebounced = debounce(this._saveLogData.bind(this), 150);
    AppState.addEventListener('change', this._handleAppStateChange.bind(this));
    NetInfo.isConnected.addEventListener('change', this._handleConnectivityChange.bind(this));
    NetInfo.addEventListener('change', this._handleConnectivityTypeChange.bind(this));
  }

  _handleConnectivityTypeChange(type) {
    if(this.previousConnectionTypes.indexOf(type) !== -1) {
      this.seperator(`CONNECTION CHANGED TO ${type.toUpperCase()}`);
    }else {
      this.previousConnectionTypes.push(type);
    }
  }

  _handleAppStateChange(currentAppState) {
    this.seperator(`APP STATE: ${currentAppState.toUpperCase()}`);
  }

  _handleConnectivityChange(isConnected) {
    if(isConnected) {
      if(this.hasBeenDisconnected) {
        this.seperator(`RECONNECTED TO INTERNET`);
      }
      this.hasBeenConnected = true;
    }else {
      if(this.hasBeenConnected) {
        this.seperator(`DISCONNECTED TO INTERNET`);
      }
      this.hasBeenDisconnected = true;
    }
  }

  setupRNErrorLogging() {
    if (ErrorUtils) {
      const defaultHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();
      if (defaultHandler) {

        const parseErrorStack = (error) => {
          if (!error || !error.stack) {
            return [];
          }
          return Array.isArray(error.stack)
            ? error.stack
            : stacktraceParser.parse(error.stack);
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
    this.storage = storageAdapter || new InMemory();

    this.options = {
      ...this.options,
      ...options
    };
    if (this.options.logRNErrors) {
      this.setupRNErrorLogging();
    }
    this._initalGet();
    return this.insertAppStartMessage();
  }

  async insertAppStartMessage() {
    if (!this.appStartRendered) {
      await this._appendToLog([APP_START_LOG_MESSAGE]);
      this.appStartRendered = true;
    }
  }

  async _initalGet() {
    this.initPromise = this._getFromStorage();
    const data = await this.initPromise;
    this.logData.rows = this.logData.rows.concat(data.rows);
    this.sortLogRows();
    this._initalGetIsResolved = true;
    await this._saveLogData(this.logData);
    return this.emitDebugRowsChanged(this.logData);
  }

  sortLogRows() {
    this.logData.rows.sort((left, right) => {
      let dateDiff = moment.utc(right.timeStamp).diff(moment.utc(left.timeStamp));
      if (dateDiff === 0) {
        return (right.lengthAtInsertion - left.lengthAtInsertion);
      }
      return dateDiff;
    });
  }

  async _getAndEmit() {
    return this.emitDebugRowsChanged(await this._getFromStorage());
  }

  async _getFromStorage() {
    let dataAsString = await this.storage.getItem(DebugService.STORAGEKEY);
    if (!dataAsString) {
      await this._saveLogData({
        rows: []
      }, true);
      return this._getFromStorage();
    }
    let debugRowsDataStorage = JSON.parse(dataAsString);
    debugRowsDataStorage.rows.forEach((row) => {
      row.timeStamp = moment(row.timeStamp);
    });
    return debugRowsDataStorage;
  }

  async _saveLogData(logData, force) {
    if (!this._initalGetIsResolved && !force) {
      return logData;
    }

    await this.storage.setItem(DebugService.STORAGEKEY, JSON.stringify(this.getSavableData(logData)));
    return logData;
  }

  async startTimer(name) {
    let timer = timers.start(name);
    return await this._log('start-timer', '#54d7df', name);
  }

  async logTime(name) {
    let timer = timers.stop(name);
    return await this._log('end-timer', '#54d7df', `${name}-timer delta:  ${timer.delta}ms`);
  }

  async clear() {
    this.logData.rows = [];
    await this.storage.removeItem(DebugService.STORAGEKEY);
    return await this._getAndEmit();
  }

  log(...logRows) {
    return this._log('log', '#FFF', ...logRows);
  }

  debug(...logRows) {
    return this._log('debug', '#5787cf', ...logRows);
  }

  info(...logRows) {
    return this._log('info', '#7fa9db', ...logRows);
  }

  error(...logRows) {
    return this._log('error', '#df5454', ...logRows);
  }

  fatal(...logRows) {
    return this._log('fatal', 'rgb(255, 0, 0)', ...logRows);
  }

  success(...logRows) {
    return this._log('success', '#54df72', ...logRows);
  }

  rnerror(fatal, message, stackTrace) {
    let errorString = `ERROR: ${message}  \nSTACKSTRACE:\n`;
    if (stackTrace && Array.isArray(stackTrace)) {
      const stackStrings = stackTrace.map((stackTraceItem) => {
        let methodName = '-';
        let lineNumber = '-';
        let column = '-';
        if (stackTraceItem.methodName) {
          methodName = stackTraceItem.methodName === '<unknown>'
            ? '-'
            : stackTraceItem.methodName;
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
      return this._log('RNFatal', 'rgb(255, 0, 0)', errorString);
    } else {
      return this._log('RNError', '#df5454', errorString);
    }
  }

  seperator(name) {
    return this._log('seperator', '#FFF', name);
  }

  async _log(level, color, ...logRows) {
    this.logToConsole(level, color, ...logRows);
    const logData = logRows.map((logRow, idx) => ({
      id: guid(),
      lengthAtInsertion: (this.logData.rows.length + idx),
      level,
      message: this._parseDataToString(logRow),
      timeStamp: moment(),
      color
    }));
    if (!this.logData.rows.length) {
      await this.insertAppStartMessage();
    }
    await this._appendToLog(logData);
    if (!this.initPromise) {
      await this._initalGet();
    }
  }

  logToConsole(level, color, ...logRows) {
    if (this.options.logToConsole) {
      let avaliableConsoleLogs = ['log', 'info', 'debug', 'error'];
      let consoleLogFunc = avaliableConsoleLogs.find(avCL => avCL === level) || 'log';
      console[consoleLogFunc](...logRows);
    }
  }

  _parseDataToString(data) {
    if (typeof data === 'string' || data instanceof String) {
      return data;
    } else {
      let dataAsString = stringify(data, null, '  '); //FYI: spaces > tabs
      if (dataAsString.length > 12000) {
        dataAsString = dataAsString.substring(0, 12000) + '...(Cannot display more RN-device-log)';
      }
      return dataAsString;
    }
  }

  _appendToLog(logDataRows) {
    this.logData.rows = logDataRows.concat(this.logData.rows);
    this._saveLogDataDebounced(this.logData);
    return this.emitDebugRowsChanged(this.logData);
  }

  onDebugRowsChanged(cb) {
    this.listners.push(cb);
    cb(this.getEmittableData(this.logData));
    return () => {
      var i = this.listners.indexOf(cb);
      if (i !== -1) {
        this.listners.splice(i, 1);
      }
    };
  }

  emitDebugRowsChanged(data) {
    this.listners.forEach((cb) => cb(this.getEmittableData(data)));
  }

  getEmittableData(data) {
    if (this.options.maxNumberToRender !== 0) {
      return {
        ...data,
        rows: data.rows.slice(0, this.options.maxNumberToRender)
      };
    }
    return data;
  }

  getSavableData(data) {
    if (this.options.maxNumberToPersist !== 0) {
      return {
        ...data,
        rows: data.rows.slice(0, this.options.maxNumberToRender)
      };
    }
    return data;
  }
}

export default new DebugService();
