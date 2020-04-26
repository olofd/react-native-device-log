import moment from 'moment'

export default class LogRow {
  id: string
  lengthAtInsertion: number
  level: string
  message: string
  timeStamp: moment.Moment
  color: string

  constructor(
    id: string,
    lengthAtInsertion: number,
    level: string,
    message: string,
    timeStamp: moment.Moment,
    color: string,
  ) {
    this.id = id
    this.lengthAtInsertion = lengthAtInsertion
    this.level = level
    this.message = message
    this.timeStamp = timeStamp
    this.color = color
  }
}
