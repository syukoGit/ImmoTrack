import type { Clock } from '../shared/ports/Clock';

export class ManualClock implements Clock {
  private current: Date;

  constructor(initial: Date | string = '2026-10-03T06:15:00.000Z') {
    this.current = new Date(initial);
  }

  now(): Date {
    return new Date(this.current);
  }

  advanceBy(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
