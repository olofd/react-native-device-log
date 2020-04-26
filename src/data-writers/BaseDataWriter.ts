import LogRow from '../LogRow'

export default interface BaseDataWriter {
  readOnly: boolean
  setReadOnly(readOnly: boolean): void
  insertRows(rows?: LogRow[], allRows?: LogRow[]): Promise<LogRow[]>
  getRows(): Promise<LogRow[]>
  clear(): Promise<void>
  logRowCreated(logRow: LogRow): void
  appendToLogRow(logRow: LogRow): LogRow
  initalDataRead(logRows: LogRow[]): void
}
