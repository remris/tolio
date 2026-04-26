import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const ADMIN_ROUTES = ['/dashboard', '/assets', '/billing', '/roles', '/settings', '/users']

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isAdminRoute = ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isPwaRoute = pathname.startsWith('/pwa')
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/company-login'

  if (isAdminRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  if (isPwaRoute) {
    const employeeSession = request.cookies.get('tolio_employee_session')
    if (!employeeSession && !user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/company-login'
      return NextResponse.redirect(loginUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

