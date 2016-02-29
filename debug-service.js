import {AsyncStorage} from 'react-native';
import moment from 'moment';
import InMemory from './adapters/in-memory';
import timers from './timers';
import debounce from 'debounce';

class DebugService {
  static STORAGEKEY = "debug-rows";
  constructor() {
    this.logData = {
      rows: []
    };
    this.listners = [];
    this.storage = new InMemory();
    this.options = {
      logToConsole: true
    };
    this._initalGetIsResolved = false;
    this._saveLogDataDebounced = debounce(this._saveLogData.bind(this), 150);
  }

  async init(storageAdapter, options) {
    this.storage = storageAdapter || new InMemory();
    this.options = {
      ...this.options,
      ...options
    };
    this._initalGet();
    return await this.seperator('APP START');
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

  async _initalGet() {
    let data = await this._getFromStorage();
    this.logData.rows = this.logData.rows.concat(data.rows);
    this.sortLogRows();
    this._initalGetIsResolved = true;
    await this._saveLogData(this.logData);
    return this.emitDebugRowsChanged(this.logData);
  }

  async _getAndEmit() {
    return this.emitDebugRowsChanged(await this._getFromStorage());
  }

  async _getFromStorage() {
    let dataAsString = await this.storage.getItem(DebugService.STORAGEKEY);
    if (!dataAsString) {
      await this._saveLogData({rows: []});
      return this._getFromStorage();
    }
    let debugRowsDataStorage = JSON.parse(dataAsString);
    debugRowsDataStorage.rows.forEach((row) => {
      row.timeStamp = moment(row.timeStamp);
    });
    return debugRowsDataStorage;
  }

  async _saveLogData(logData) {
    if (!this._initalGetIsResolved) {
      return logData;
    }
    await this.storage.setItem(DebugService.STORAGEKEY, JSON.stringify(logData));
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

  success(...logRows) {
    return this._log('success', '#54df72', ...logRows);
  }

  seperator(name) {
    return this._log('seperator', '#FFF', name);
  }

  _log(level, color, ...logRows) {
    this.logToConsole(level, color, ...logRows);
    return this._appendToLog(logRows.map((logRow, idx) => {
      return {
        lengthAtInsertion: (this.logData.rows.length + idx),
        level,
        message: this._parseDataToString(logRow),
        timeStamp: moment(),
        color
      }
    }));
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
      return JSON.stringify(data)
    }
  }

  _appendToLog(logDataRows) {
    this.logData.rows = logDataRows.concat(this.logData.rows);
    this._saveLogDataDebounced(this.logData);
    return this.emitDebugRowsChanged(this.logData);
  }

  onDebugRowsChanged(cb) {
    this.listners.push(cb);
    return () => {
      var i = this.listners.indexOf(cb);
      if (i !== -1) {
        this.listners.splice(i, 1);
      }
    };
  }

  emitDebugRowsChanged(data) {
    this.listners.forEach((cb) => cb(data));
  }
}

export default new DebugService();
