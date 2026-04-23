import { createServerClient } from '@supabase/ssr'
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

export async function middleware(request: NextRequest) {
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

  // Admin + API routes – require Supabase auth session
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/assets') ||
    pathname.startsWith('/api/roles') ||
    pathname.startsWith('/api/users') ||
    pathname.startsWith('/api/export')
  ) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
