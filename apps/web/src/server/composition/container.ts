import 'server-only';

import type { Logger } from '@immotrack/application';
import { createPinoLogger } from '@immotrack/infrastructure';

import { loadServerConfig, readLogLevel } from '../config/serverConfig';
import type { Container } from './createContainer';
import { createContainer } from './createContainer';

/**
 * Instances par processus serveur, créées à la première utilisation puis immuables : le pool
 * PostgreSQL doit être partagé entre requêtes d'une même instance serverless.
 */
let logger: Logger | undefined;
let container: Container | undefined;

export const getServerLogger = (): Logger => {
  logger ??= createPinoLogger({ level: readLogLevel(), service: 'immotrack-web' });
  return logger;
};

export const getContainer = (): Container => {
  container ??= createContainer(loadServerConfig(), getServerLogger());
  return container;
};
