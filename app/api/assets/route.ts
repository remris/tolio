import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'
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

  const { name, type, status, notes, license_plate, mileage, tuv_date,
    last_maintenance_at, next_maintenance_at, serial_no, manufacturer } = parsed.data

  const supabase = adminSession ? await createClient() : await createServiceClient()

  // Generate unique QR token
  const qr_code = crypto.randomUUID()

  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .insert({ company_id: session.company_id, name, type, status: status ?? 'available', notes, qr_code })
    .select()
    .single()

  if (assetError) return NextResponse.json({ error: assetError.message }, { status: 500 })

  // Insert type-specific record
  if (type === 'tool') {
    await supabase.from('tools').insert({ asset_id: asset.id })
  } else if (type === 'machine') {
    await supabase.from('machines').insert({
      asset_id: asset.id, serial_no, manufacturer,
      last_maintenance: machine_last_maintenance ?? null,
      next_maintenance: machine_next_maintenance ?? null,
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

