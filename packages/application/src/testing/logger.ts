import type { LogContext, Logger, LogLevel } from '../shared/ports/Logger';

export interface RecordedLog {
  readonly level: LogLevel;
  readonly message: string;
  readonly context: LogContext;
}

/** Logger de test : conserve les entrées (contexte des `child` fusionné) pour assertions. */
export class RecordingLogger implements Logger {
  constructor(
    readonly entries: RecordedLog[] = [],
    private readonly bindings: LogContext = {},
  ) {}

  debug(message: string, context?: LogContext): void {
    this.record('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.record('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.record('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.record('error', message, context);
  }

  child(bindings: LogContext): Logger {
    return new RecordingLogger(this.entries, { ...this.bindings, ...bindings });
  }

  private record(level: LogLevel, message: string, context: LogContext = {}): void {
    this.entries.push({ level, message, context: { ...this.bindings, ...context } });
  }
}
