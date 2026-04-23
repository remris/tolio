import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { PermissionKey } from '@/lib/types'

const schema = z.object({
  code: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const { code, username, password } = parsed.data
  const supabase = await createServiceClient()

  // Find company by code
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('code', code.toUpperCase())
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Firmencode ungültig.' }, { status: 401 })
  }

  // Find user
  const { data: user } = await supabase
    .from('users')
    .select('id, company_id, username, email, role_id, password_hash, active')
    .eq('company_id', company.id)
    .eq('username', username)
    .single()

  if (!user || !user.active || !user.password_hash) {
    return NextResponse.json({ error: 'Ungültige Anmeldedaten.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Ungültige Anmeldedaten.' }, { status: 401 })
  }

  // Fetch permissions
  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('permissions(key)')
    .eq('role_id', user.role_id ?? '')

  const permissions: PermissionKey[] =
    rolePerms?.flatMap((rp: any) =>
      rp.permissions ? [rp.permissions.key as PermissionKey] : [],
    ) ?? []

  const sessionUser = {
    id: user.id,
    auth_id: '',
    company_id: user.company_id,
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    permissions,
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('tolio_employee_session', JSON.stringify(sessionUser), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })
  return response
}

