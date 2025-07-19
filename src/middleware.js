import { NextResponse } from 'next/server';

export function middleware(request) {
    // Define public routes that don't require authentication
    const publicPaths = ['/login', '/signup', '/api/auth/login', '/api/auth/signup'];
    
    // Check if the current path is public
    const isPublicPath = publicPaths.some(path => 
        request.nextUrl.pathname === path || 
        request.nextUrl.pathname.startsWith(path + '/')
    );

    // Get the token from cookies
    const token = request.cookies.get('token')?.value;

    // If it's a public path, allow access
    if (isPublicPath) {
        // If user is already logged in and tries to access login/signup, redirect to home
        if (token && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // If there's no token and the path is not public, redirect to login
    if (!token && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Continue with the request if authenticated
    return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
