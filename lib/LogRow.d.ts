import moment from 'moment';
export default class LogRow {
    id: string;
    lengthAtInsertion: number;
    level: string;
    message: string;
    timeStamp: moment.Moment;
    color: string;
    constructor(id: string, lengthAtInsertion: number, level: string, message: string, timeStamp: moment.Moment, color: string);
}
