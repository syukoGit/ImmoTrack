import { NextResponse } from 'next/server';

import { createIdentityAdapter } from '@/server/auth/adminSession';

export async function POST(request: Request): Promise<Response> {
  const adapter = await createIdentityAdapter();
  await adapter?.signOut();
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
