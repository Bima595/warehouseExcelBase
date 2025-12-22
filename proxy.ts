import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Route yang tidak memerlukan autentikasi
  const publicRoutes = ['/login', '/register', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Jika route adalah public, lanjutkan tanpa cek
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Periksa keberadaan accessToken dan refreshToken
  const accessToken = request.cookies.get('accessToken');
  const refreshToken = request.cookies.get('refreshToken');
  const authCookie = request.cookies.get('auth');

  console.log('[MIDDLEWARE] Tokens check:', {
    accessToken: accessToken ? 'exists' : 'missing',
    refreshToken: refreshToken ? 'exists' : 'missing',
    authCookie: authCookie ? 'exists' : 'missing',
  });

  // Jika tidak ada token dan bukan route public, redirect ke login
  if (!accessToken && !refreshToken && !authCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika user sudah login dan mencoba akses login/register, redirect ke home
  if ((accessToken || refreshToken || authCookie) && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('[MIDDLEWARE] Allowing access to:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

