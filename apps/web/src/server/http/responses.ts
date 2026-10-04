import type { ApiErrorCode, ApiErrorDetail, ApiErrorResponse } from '@immotrack/contracts';
import { CORRELATION_ID_HEADER } from '@immotrack/contracts';

export const jsonResponse = (
  status: number,
  body: unknown,
  correlationId: string,
  headers: Record<string, string> = {},
): Response =>
  Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', [CORRELATION_ID_HEADER]: correlationId, ...headers },
  });

export const errorResponse = (
  status: number,
  code: ApiErrorCode,
  message: string,
  correlationId: string,
  options: { details?: readonly ApiErrorDetail[]; headers?: Record<string, string> } = {},
): Response => {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      correlationId,
      ...(options.details === undefined ? {} : { details: options.details }),
    },
  };
  return jsonResponse(status, body, correlationId, options.headers);
};
