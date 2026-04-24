import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  username: z.string().min(2),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6),
  role_id: z.string().uuid().optional().nullable(),
})

export async function GET() {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role_id, active, created_at, roles(name)')
    .eq('company_id', session.company_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requirePermission(session, 'users.create') }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { username, email, password, role_id } = parsed.data
  const supabase = await createServiceClient()

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('users')
    .insert({ company_id: session.company_id, username, email, role_id, password_hash, active: true })
    .select('id, username, email, role_id, active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

