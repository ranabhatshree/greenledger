import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];
const ONBOARDING_PATH = '/onboarding';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.includes(path);
  const isOnboardingPath = path === ONBOARDING_PATH;

  // If trying to access public paths while already authenticated
  // Note: We can't check onboarding status in middleware, so we'll let the client handle it
  if (isPublicPath && token) {
    // Redirect to onboarding - client will check and redirect to dashboard if complete
    return NextResponse.redirect(new URL(ONBOARDING_PATH, request.url));
  }

  // Allow onboarding path for authenticated users (client will handle redirect if complete)
  if (isOnboardingPath && token) {
    return NextResponse.next();
  }

  // If trying to access protected routes without authentication
  if (!token && !isPublicPath && !isOnboardingPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Add your protected routes here
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}; 