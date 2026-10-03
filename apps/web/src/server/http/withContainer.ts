import 'server-only';

import { getContainer, getServerLogger } from '../composition/container';
import type { Container } from '../composition/createContainer';
import { resolveCorrelationId } from './correlation';
import { mapErrorToResponse } from './mapErrorToResponse';

/** Résout le container pour un Route Handler ; une configuration invalide devient une 503. */
export const withContainer = async (
  request: Request,
  handle: (container: Container) => Promise<Response>,
): Promise<Response> => {
  let container: Container;
  try {
    container = getContainer();
  } catch (error) {
    return mapErrorToResponse(error, resolveCorrelationId(request.headers), getServerLogger());
  }
  return handle(container);
};
