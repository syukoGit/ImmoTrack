import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleAdminSession } from '@/server/auth/proxySession';
import { ConfigurationError, loadAuthConfig } from '@/server/config/serverConfig';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  try {
    return await handleAdminSession(request, loadAuthConfig());
  } catch (error) {
    // Configuration d'authentification invalide : on échoue fermé, sans détail.
    const status = error instanceof ConfigurationError ? 503 : 500;
    return new NextResponse('Service unavailable.', { status });
  }
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
