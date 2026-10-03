import { CORRELATION_ID_HEADER } from '@immotrack/contracts';

const ACCEPTED_CORRELATION_ID = /^[A-Za-z0-9._:-]{8,128}$/;

/** Réutilise l'identifiant de corrélation fourni par l'appelant s'il est sûr, sinon en crée un. */
export const resolveCorrelationId = (headers: Headers): string => {
  const provided = headers.get(CORRELATION_ID_HEADER);
  return provided !== null && ACCEPTED_CORRELATION_ID.test(provided)
    ? provided
    : crypto.randomUUID();
};
