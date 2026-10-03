import type { LogContext, Logger, LogLevel } from '@immotrack/application';
import type { DestinationStream, Logger as Pino } from 'pino';
import pino from 'pino';

/**
 * Clés masquées quel que soit leur niveau d'imbrication courant. Les secrets ne devraient jamais
 * être loggués : ce masquage est une défense en profondeur, pas une autorisation.
 */
const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'serviceRoleKey',
  'databaseUrl',
  'connectionString',
];

const REDACTED_PATHS = SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`, `*.*.${key}`]);

export interface PinoLoggerOptions {
  readonly level: LogLevel;
  readonly service: string;
  /** Flux de sortie (stdout par défaut) ; injectable pour les tests. */
  readonly destination?: DestinationStream;
}

/** Logs JSON structurés (une ligne par événement), compatibles avec les logs Vercel. */
export const createPinoLogger = (options: PinoLoggerOptions): Logger => {
  const instance = pino(
    {
      level: options.level,
      base: { service: options.service },
      messageKey: 'message',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: (label) => ({ level: label }) },
      redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
      serializers: { err: pino.stdSerializers.err },
    },
    options.destination,
  );
  return new PinoLogger(instance);
};

class PinoLogger implements Logger {
  constructor(private readonly instance: Pino) {}

  debug(message: string, context: LogContext = {}): void {
    this.instance.debug(context, message);
  }

  info(message: string, context: LogContext = {}): void {
    this.instance.info(context, message);
  }

  warn(message: string, context: LogContext = {}): void {
    this.instance.warn(context, message);
  }

  error(message: string, context: LogContext = {}): void {
    this.instance.error(context, message);
  }

  child(bindings: LogContext): Logger {
    return new PinoLogger(this.instance.child(bindings));
  }
}
