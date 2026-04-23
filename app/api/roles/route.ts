import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  permission_ids: z.array(z.string().uuid()).optional(),
})

export async function GET() {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roles')
    .select('*, role_permissions(permission_id, permissions(key))')
    .eq('company_id', session.company_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requirePermission(session, 'roles.manage') }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, permission_ids } = parsed.data
  const supabase = await createClient()

  const { data: role, error } = await supabase
    .from('roles')
    .insert({ company_id: session.company_id, name })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (permission_ids?.length) {
    await supabase.from('role_permissions').insert(
      permission_ids.map((pid) => ({ role_id: role.id, permission_id: pid })),
    )
  }

  return NextResponse.json(role, { status: 201 })
}

