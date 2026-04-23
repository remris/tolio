import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateSchema = z.object({
  username: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional(),
  role_id: z.string().uuid().optional().nullable(),
  active: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role_id, active, created_at, roles(name)')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requirePermission(session, 'users.update') }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = await createServiceClient()

  // Verify user belongs to same company
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { username, email, password, role_id, active } = parsed.data
  const updates: Record<string, unknown> = {}

  if (username !== undefined) updates.username = username
  if (email !== undefined) updates.email = email
  if (role_id !== undefined) updates.role_id = role_id
  if (active !== undefined) updates.active = active
  if (password) updates.password_hash = await bcrypt.hash(password, 12)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requirePermission(session, 'users.delete') }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const supabase = await createServiceClient()

  // Prevent self-deletion
  if (id === session.id) {
    return NextResponse.json({ error: 'Du kannst dich nicht selbst löschen.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

