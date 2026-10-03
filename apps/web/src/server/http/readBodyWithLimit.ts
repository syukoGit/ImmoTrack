export type BodyReadResult = { readonly ok: true; readonly text: string } | { readonly ok: false };

/** Lit le corps en flux et s'arrête dès que la limite est dépassée (pas de buffer non borné). */
export const readBodyWithLimit = async (
  request: Request,
  maxBytes: number,
): Promise<BodyReadResult> => {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false };
  }
  if (request.body === null) {
    return { ok: true, text: '' };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return { ok: false };
    }
    chunks.push(value);
  }

  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder('utf-8', { fatal: false }).decode(buffer) };
};
