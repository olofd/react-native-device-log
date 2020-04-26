interface TimerCollection {
    [key: string]: Timer;
}
interface Timer {
    start: number;
    stop?: number;
    delta?: number;
}
export declare class Timers {
    timers: TimerCollection;
    constructor();
    start(timerName: string): Timer;
    stop(timerName: string): Timer;
    get(timerName: string): Timer;
    remove(timerName: string): void;
}
declare const _default: Timers;
export default _default;
