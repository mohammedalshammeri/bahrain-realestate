import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Get token from cookies (preferred) or authorization header
  const cookieToken = request.cookies.get('admin_token')?.value;
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Check if token exists and is not empty
  const token = cookieToken || headerToken;
  const isValidToken = token && token.trim() !== '' && token !== 'undefined' && token !== 'null';

  // If no valid token is found, redirect to login
  if (!isValidToken) {
    const loginUrl = new URL('/auth/login', request.url);
    
    // Add cache-busting parameter to ensure fresh redirect
    loginUrl.searchParams.set('redirected', 'true');
    loginUrl.searchParams.set('from', pathname);
    
    // Create response with redirect
    const response = NextResponse.redirect(loginUrl);
    
    // Clear any existing auth cookies to prevent issues
    response.cookies.set('admin_token', '', {
      expires: new Date(0),
      path: '/',
    });
    
    // Add headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }

  // If token exists, allow the request to continue
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/admin",
    "/admin/:path*",
    "/companies/:path*",
    "/properties/:path*", 
    "/complaints/:path*",
    "/settings/:path*",
    "/ads/:path*",
    "/system/:path*",
    "/system-employees/:path*",
    "/withdrawals/:path*",
    "/profile"
  ]
};
