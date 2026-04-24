import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'
import { getPlan, checkAssetLimit } from '@/lib/stripe/plans'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['tool', 'machine', 'vehicle']),
  status: z.enum(['available', 'in_use', 'broken', 'maintenance']).optional(),
  notes: z.string().optional(),
  // vehicle fields
  license_plate: z.string().optional(),
  mileage: z.number().optional(),
  tuv_date: z.string().optional(),
  last_maintenance_at: z.string().optional(),
  next_maintenance_at: z.string().optional(),
  // machine fields
  serial_no: z.string().optional(),
  manufacturer: z.string().optional(),
  machine_last_maintenance: z.string().optional(),
  machine_next_maintenance: z.string().optional(),
  maintenance_interval_months: z.number().int().min(1).max(120).optional(),
  // tool fields
  tool_serial_no: z.string().optional(),
  tool_condition: z.enum(['good', 'worn', 'damaged']).optional(),
  // location
  location_id: z.string().uuid().nullable().optional(),
})

export async function GET(req: NextRequest) {
  const adminSession = await getSessionUser()
  const session = adminSession ?? (await getEmployeeSession())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = adminSession ? await createClient() : await createServiceClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  let query = supabase
    .from('assets')
    .select('*, tools(*), machines(*), vehicles(*)')
    .eq('company_id', session.company_id)
    .order('name', { ascending: true })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const adminSession = await getSessionUser()
  const session = adminSession ?? (await getEmployeeSession())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    requirePermission(session, 'assets.create')
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, type, status, notes, location_id, license_plate, mileage, tuv_date,
    last_maintenance_at, next_maintenance_at, serial_no, manufacturer,
    machine_last_maintenance, machine_next_maintenance, maintenance_interval_months,
    tool_serial_no, tool_condition } = parsed.data

  const supabase = adminSession ? await createClient() : await createServiceClient()

  // Enforce plan asset limit
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('company_id', session.company_id)
    .single()
  const plan = getPlan(sub?.plan)
  const { count: currentAssets } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', session.company_id)
  if (!checkAssetLimit(plan, currentAssets ?? 0)) {
    return NextResponse.json(
      { error: `Asset-Limit für Plan "${plan.name}" erreicht (max. ${plan.assetLimit}). Bitte upgraden.` },
      { status: 403 }
    )
  }

  // Generate unique QR token
  const qr_code = crypto.randomUUID()

  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .insert({ company_id: session.company_id, name, type, status: status ?? 'available', notes, qr_code, location_id: location_id ?? null })
    .select()
    .single()

  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 })

  // Auto-calculate next_maintenance for machines
  function calcNextMaintenance(last: string | undefined, intervalMonths: number | null | undefined): string | null {
    if (!last || !intervalMonths) return null
    const d = new Date(last)
    d.setMonth(d.getMonth() + intervalMonths)
    return d.toISOString().slice(0, 10)
  }

  // Insert type-specific record
  if (type === 'tool') {
    await supabase.from('tools').insert({ asset_id: asset.id, serial_no: tool_serial_no ?? null, condition: tool_condition ?? 'good' })
  } else if (type === 'machine') {
    const computedNext = machine_next_maintenance || calcNextMaintenance(machine_last_maintenance, maintenance_interval_months)
    await supabase.from('machines').insert({
      asset_id: asset.id, serial_no, manufacturer,
      last_maintenance: machine_last_maintenance ?? null,
      next_maintenance: computedNext,
      maintenance_interval_months: maintenance_interval_months ?? null,
    })
  } else if (type === 'vehicle') {
    if (!license_plate) {
      return NextResponse.json({ error: 'Kennzeichen erforderlich.' }, { status: 400 })
    }
    await supabase.from('vehicles').insert({
      asset_id: asset.id,
      license_plate,
      mileage: mileage ?? 0,
      tuv_date,
      last_maintenance_at,
      next_maintenance_at,
    })
  }

  return NextResponse.json(asset, { status: 201 })
}

