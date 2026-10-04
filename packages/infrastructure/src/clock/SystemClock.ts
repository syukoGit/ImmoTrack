import type { Clock } from '@immotrack/application';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
