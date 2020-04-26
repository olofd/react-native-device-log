export default class LogRow {
    constructor(id, lengthAtInsertion, level, message, timeStamp, color) {
        this.id = id;
        this.lengthAtInsertion = lengthAtInsertion;
        this.level = level;
        this.message = message;
        this.timeStamp = timeStamp;
        this.color = color;
    }
}
