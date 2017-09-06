const timestamp = {
    now: () => {
        return new Date().getTime();
    },
};

export class Timers {
    constructor() {
        this.timers = {};
    }

    start(timer_name) {
        this.timers[timer_name] = {
            start: timestamp.now(),
            stop: undefined,
            delta: undefined,
        };
        return this.timers[timer_name];
    }

    stop(timer_name) {
        const timer = this.timers[timer_name];
        timer.stop = timestamp.now();
        timer.delta = timer.stop - timer.start;
        return timer;
    }

    get(timer_name) {
        return this.timers[timer_name];
    }

    remove(timer_name) {
        if (this.timers[timer_name]) {
            delete this.timers[timer_name];
        }
    }
}

export default new Timers();
