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
  const fuel_status: string | undefined = body?.fuel_status || undefined
  const note: string | undefined = body?.note || undefined

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

  // Ownership check
  const { data: lastCheckout } = await supabase
    .from('asset_logs')
    .select('user_id')
    .eq('asset_id', id)
    .eq('action', 'check_out')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (lastCheckout?.user_id && lastCheckout.user_id !== session.id) {
    return NextResponse.json({ error: 'Nur die Person, die ausgecheckt hat, kann zurückgeben.' }, { status: 403 })
  }

  await supabase
    .from('assets')
    .update({ status: 'available', updated_at: new Date().toISOString() })
    .eq('id', id)

  const { data: logEntry } = await supabase.from('asset_logs').insert({
    asset_id: id,
    user_id: session.id,
    action: 'check_in',
    mileage: mileage ?? null,
    fuel_status: fuel_status ?? null,
    note: note ?? null,
  }).select('id').single()

  if (asset.type === 'vehicle') {
    const vehicleUpdate: Record<string, unknown> = { assigned_user_id: null }
    if (mileage !== undefined) vehicleUpdate.mileage = mileage
    if (fuel_status) vehicleUpdate.fuel_status = fuel_status
    await supabase.from('vehicles').update(vehicleUpdate).eq('asset_id', id)
  }

  return NextResponse.json({ ok: true, log_id: logEntry?.id ?? null })
}

