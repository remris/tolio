import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/company-login',
  '/api/auth/company-login',
  '/api/auth/register',
  '/api/webhooks',
  '/api/reminders',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // PWA routes – require employee session cookie
  if (pathname.startsWith('/pwa')) {
    const sessionCookie = request.cookies.get('tolio_employee_session')
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/company-login', request.url))
    }
    return NextResponse.next()
  }

  // Admin + API routes – require Supabase auth cookie
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/assets') ||
    pathname.startsWith('/api/roles') ||
    pathname.startsWith('/api/users') ||
    pathname.startsWith('/api/export')
  ) {
    const hasAuthCookie = request.cookies.getAll().some(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )

    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

