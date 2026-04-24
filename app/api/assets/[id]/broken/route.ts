import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'

type Params = { params: Promise<{ id: string }> }

async function resolveSession() {
  const admin = await getSessionUser()
  if (admin) return admin
  return await getEmployeeSession()
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await resolveSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const note: string | undefined = body?.note?.trim()
  if (!note) return NextResponse.json({ error: 'Notiz ist erforderlich.' }, { status: 400 })

  const supabase = await createServiceClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('id, status, type, company_id')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Asset nicht gefunden.' }, { status: 404 })
  if (asset.status !== 'in_use') {
    return NextResponse.json({ error: 'Asset ist nicht ausgecheckt.' }, { status: 409 })
  }

  // Only the user who checked it out can report it as broken
  const { data: lastCheckout } = await supabase
    .from('asset_logs')
    .select('user_id')
    .eq('asset_id', id)
    .eq('action', 'check_out')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (lastCheckout?.user_id && lastCheckout.user_id !== session.id) {
    return NextResponse.json({ error: 'Nur die Person, die ausgecheckt hat, kann Defekt melden.' }, { status: 403 })
  }

  await supabase
    .from('assets')
    .update({ status: 'broken', updated_at: new Date().toISOString() })
    .eq('id', id)

  const { data: logEntry } = await supabase.from('asset_logs').insert({
    asset_id: id,
    user_id: session.id,
    action: 'check_in',
    note: `[DEFEKT] ${note}`,
    mileage: null,
  }).select('id').single()

  return NextResponse.json({ ok: true, log_id: logEntry?.id ?? null })
}

