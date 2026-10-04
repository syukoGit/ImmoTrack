export const dynamic = 'force-dynamic';

/** Sonde de vivacité minimale : ne touche ni la base ni les secrets. */
export function GET(): Response {
  return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } });
}
