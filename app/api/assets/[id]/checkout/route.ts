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

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await resolveSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const mileage: number | undefined = typeof body?.mileage === 'number' ? body.mileage : undefined
  const note: string | undefined = body?.note

  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('id, status, type, company_id')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Asset nicht gefunden.' }, { status: 404 })
  if (asset.status !== 'available') {
    return NextResponse.json({ error: 'Asset ist nicht verfügbar.' }, { status: 409 })
  }

  await supabase
    .from('assets')
    .update({ status: 'in_use', updated_at: new Date().toISOString() })
    .eq('id', id)

  await supabase.from('asset_logs').insert({
    asset_id: id,
    user_id: session.id,
    action: 'check_out',
    mileage: mileage ?? null,
    note: note ?? null,
  })

  // Update vehicle assigned driver + mileage
  if (asset.type === 'vehicle') {
    const vehicleUpdate: Record<string, unknown> = { assigned_user_id: session.id }
    if (mileage !== undefined) vehicleUpdate.mileage = mileage
    await supabase.from('vehicles').update(vehicleUpdate).eq('asset_id', id)
  }

  return NextResponse.json({ ok: true })
}
