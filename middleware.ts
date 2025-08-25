import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their access requirements
const protectedRoutes = ['/dashboard', '/universities', '/courses', '/modules', '/files', '/professors', '/students', '/tokens', '/admin', '/profile'];
const authRoutes = ['/login', '/forgot-password', '/reset-password'];
const superAdminOnlyRoutes = ['/admin', '/universities'];
const adminOnlyRoutes = ['/professors'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check localStorage token (this needs to be handled client-side)
  // For now, we'll let client-side components handle authentication
  // since middleware doesn't have access to localStorage
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));
  
  // Don't redirect on middleware level since we use localStorage for tokens
  // Let the client-side AuthProvider and ProtectedRoute components handle redirects
  
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
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};