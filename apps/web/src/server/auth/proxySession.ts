import { SupabaseIdentityAdapter } from '@immotrack/infrastructure/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { AuthConfig } from '../config/serverConfig';

const PUBLIC_PATHS = ['/login'];

const isPublicPath = (pathname: string): boolean =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * Rafraîchit la session Supabase et redirige les visiteurs non authentifiés vers /login.
 * Les routes /api/* ont leur propre authentification et ne passent pas par ici.
 */
export const handleAdminSession = async (
  request: NextRequest,
  config: AuthConfig,
): Promise<NextResponse> => {
  let response = NextResponse.next({ request });
  if (config.mode === 'disabled') {
    return response;
  }

  const adapter = new SupabaseIdentityAdapter(config.supabase, {
    getAll: () => request.cookies.getAll(),
    setAll: (toSet) => {
      for (const { name, value } of toSet) {
        request.cookies.set(name, value);
      }
      response = NextResponse.next({ request });
      for (const { name, value, options } of toSet) {
        response.cookies.set(name, value, options);
      }
    },
  });
  const admin = await adapter.getCurrentAdmin();
  const { pathname } = request.nextUrl;

  if (admin === null && !isPublicPath(pathname)) {
    return redirectPreservingCookies(request, response, '/login');
  }
  if (admin !== null && pathname === '/login') {
    return redirectPreservingCookies(request, response, '/');
  }
  return response;
};

const redirectPreservingCookies = (
  request: NextRequest,
  from: NextResponse,
  pathname: string,
): NextResponse => {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
};
