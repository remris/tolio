import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'

export async function GET() {
  const session = (await getSessionUser()) ?? (await getEmployeeSession())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    id: session.id,
    username: session.username,
    company_id: session.company_id,
    permissions: session.permissions,
  })
}

