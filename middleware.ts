import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/login', '/register', '/company-login', '/api/auth/company-login', '/api/auth/register', '/api/webhooks']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Admin routes – require Supabase auth session
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/assets') || pathname.startsWith('/api/roles') || pathname.startsWith('/api/users')) {
    const { supabaseResponse, user } = await updateSession(request)
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // PWA routes – require employee session cookie
  if (pathname.startsWith('/pwa')) {
    const sessionCookie = request.cookies.get('tolio_employee_session')
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/company-login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

