const timestamp = {
    now: () => {
        return new Date().getTime();
    },
};
export class Timers {
    constructor() {
        this.timers = {};
    }
    start(timerName) {
        this.timers[timerName] = {
            start: timestamp.now(),
            stop: undefined,
            delta: undefined,
        };
        return this.timers[timerName];
    }
    stop(timerName) {
        const timer = this.timers[timerName];
        timer.stop = timestamp.now();
        timer.delta = timer.stop - timer.start;
        return timer;
    }
    get(timerName) {
        return this.timers[timerName];
    }
    remove(timerName) {
        if (this.timers[timerName]) {
            delete this.timers[timerName];
        }
    }
}
export default new Timers();
