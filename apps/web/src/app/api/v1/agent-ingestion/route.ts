import { withContainer } from '@/server/http/withContainer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Route Handler mince : toute la logique est dans l'adaptateur HTTP et le use case. */
export function POST(request: Request): Promise<Response> {
  return withContainer(request, (container) => container.http.agentIngestion(request));
}
