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
  const rawMileage = body?.mileage
  const mileage: number | undefined = typeof rawMileage === 'number' && !isNaN(rawMileage)
    ? rawMileage
    : typeof rawMileage === 'string' && rawMileage !== ''
      ? (isNaN(parseInt(rawMileage, 10)) ? undefined : parseInt(rawMileage, 10))
      : undefined
  const note: string | undefined = body?.note || undefined

  const supabase = await createServiceClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('id, status, type, company_id')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Asset nicht gefunden.' }, { status: 404 })
  if (asset.status !== 'available') {
    const { data: lastLog } = await supabase
      .from('asset_logs')
      .select('user_id, users(username)')
      .eq('asset_id', id)
      .eq('action', 'check_out')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    const holder = (lastLog as any)?.users?.username ?? null
    return NextResponse.json({
      error: holder ? `Bereits ausgecheckt von ${holder}.` : 'Asset ist nicht verfügbar.',
      holder,
    }, { status: 409 })
  }

  await supabase
    .from('assets')
    .update({ status: 'in_use', updated_at: new Date().toISOString() })
    .eq('id', id)

  const { data: logEntry } = await supabase.from('asset_logs').insert({
    asset_id: id,
    user_id: session.id,
    action: 'check_out',
    mileage: mileage ?? null,
    note: note ?? null,
  }).select('id').single()

  if (asset.type === 'vehicle') {
    const vehicleUpdate: Record<string, unknown> = { assigned_user_id: session.id }
    if (mileage !== undefined) vehicleUpdate.mileage = mileage
    await supabase.from('vehicles').update(vehicleUpdate).eq('asset_id', id)
  }

  return NextResponse.json({ ok: true, log_id: logEntry?.id ?? null })
}

