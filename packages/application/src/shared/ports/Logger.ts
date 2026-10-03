export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Contexte structuré d'un log. Les clés standard permettent de corréler une requête, un run et
 * une source. Ne jamais y placer de secret (token, mot de passe, clé) : l'adaptateur masque les
 * clés sensibles connues mais ce n'est qu'une défense en profondeur.
 */
export interface LogContext {
  readonly correlationId?: string;
  readonly runId?: string;
  readonly sourceCode?: string;
  readonly eventType?: string;
  readonly err?: unknown;
  readonly [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}
