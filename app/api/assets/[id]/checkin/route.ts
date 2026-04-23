import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'

type Params = { params: Promise<{ id: string }> }

async function resolveSession() {
  const admin = await getSessionUser()
  if (admin) return admin
  return await getEmployeeSession()
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await resolveSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('id, status, company_id')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Asset nicht gefunden.' }, { status: 404 })
  if (asset.status !== 'in_use') {
    return NextResponse.json({ error: 'Asset ist nicht ausgecheckt.' }, { status: 409 })
  }

  await supabase.from('assets').update({ status: 'available', updated_at: new Date().toISOString() }).eq('id', id)
  await supabase.from('asset_logs').insert({ asset_id: id, user_id: session.id, action: 'check_in' })

  return NextResponse.json({ ok: true })
}

