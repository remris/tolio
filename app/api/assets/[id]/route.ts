import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['available', 'in_use', 'broken', 'maintenance']).optional(),
  notes: z.string().optional(),
  license_plate: z.string().optional(),
  mileage: z.number().optional(),
  tuv_date: z.string().nullable().optional(),
  last_maintenance_at: z.string().nullable().optional(),
  next_maintenance_at: z.string().nullable().optional(),
  serial_no: z.string().optional(),
  manufacturer: z.string().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assets')
    .select('*, tools(*), machines(*), vehicles(*)')
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

  try { requirePermission(session, 'assets.update') }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = await createClient()

  // Verify asset belongs to company
  const { data: asset } = await supabase
    .from('assets')
    .select('id, type')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, status, notes, license_plate, mileage, tuv_date,
    last_maintenance_at, next_maintenance_at, serial_no, manufacturer } = parsed.data

  if (name || status || notes !== undefined) {
    await supabase
      .from('assets')
      .update({ ...(name && { name }), ...(status && { status }), ...(notes !== undefined && { notes }), updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  if (asset.type === 'vehicle' && (license_plate || mileage !== undefined || tuv_date !== undefined || last_maintenance_at !== undefined || next_maintenance_at !== undefined)) {
    await supabase
      .from('vehicles')
      .update({ license_plate, mileage, tuv_date, last_maintenance_at, next_maintenance_at })
      .eq('asset_id', id)
  }

  if (asset.type === 'machine' && (serial_no || manufacturer)) {
    await supabase
      .from('machines')
      .update({ serial_no, manufacturer })
      .eq('asset_id', id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requirePermission(session, 'assets.delete') }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const supabase = await createClient()
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)
    .eq('company_id', session.company_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

