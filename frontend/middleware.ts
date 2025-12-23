import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/admin']

// Auth routes that should redirect to dashboard if already logged in
const authRoutes = ['/autentikasi', '/autentikasi/registrasi']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if user has auth_token cookie (indicates active session)
  const authToken = request.cookies.get('auth_token')
  const isAuthenticated = !!authToken

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if current route is auth page
  const isAuthRoute = authRoutes.some(route => pathname === route)

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/autentikasi', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth pages while already logged in
  if (isAuthRoute && isAuthenticated) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
