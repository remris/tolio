import { cookies } from 'next/headers'
import type { SessionUser } from '@/lib/types'

const EMPLOYEE_SESSION_COOKIE = 'tolio_employee_session'

export async function getEmployeeSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(EMPLOYEE_SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export async function setEmployeeSession(user: SessionUser, response: Response) {
  const cookieStore = await cookies()
  cookieStore.set(EMPLOYEE_SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
  })
}

export async function clearEmployeeSession() {
  const cookieStore = await cookies()
  cookieStore.delete(EMPLOYEE_SESSION_COOKIE)
}

