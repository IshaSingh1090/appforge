import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protect dashboard, builder, and apps routes
  const protectedPaths = ['/dashboard', '/builder', '/apps'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
