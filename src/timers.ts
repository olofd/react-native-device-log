const timestamp = {
  now: () => {
    return new Date().getTime()
  },
}

interface TimerCollection {
  [key: string]: Timer
}

interface Timer {
  start: number
  stop?: number
  delta?: number
}

export class Timers {
  timers: TimerCollection
  constructor() {
    this.timers = {}
  }

  start(timerName: string) {
    this.timers[timerName] = {
      start: timestamp.now(),
      stop: undefined,
      delta: undefined,
    }
    return this.timers[timerName]
  }

  stop(timerName: string) {
    const timer = this.timers[timerName]
    timer.stop = timestamp.now()
    timer.delta = timer.stop - timer.start
    return timer
  }

  get(timerName: string) {
    return this.timers[timerName]
  }

  remove(timerName: string) {
    if (this.timers[timerName]) {
      delete this.timers[timerName]
    }
  }
}

export default new Timers()
