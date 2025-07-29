import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('access_token')?.value

  const isProtectedRoute =
    !token &&
    !['/login', '/_next', '/favicon.ico'].some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )

  if (isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/profile',
    '/referrals/:path*',
    '/reviews/:path*',
    '/hr-evaluation',
    '/admin',
  ],
}
