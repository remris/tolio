import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['available', 'in_use', 'broken', 'maintenance']).optional(),
  notes: z.string().optional(),
  location_id: z.string().uuid().nullable().optional(),
  license_plate: z.string().optional(),
  mileage: z.number().optional(),
  tuv_date: z.string().nullable().optional(),
  last_maintenance_at: z.string().nullable().optional(),
  next_maintenance_at: z.string().nullable().optional(),
  serial_no: z.string().optional(),
  manufacturer: z.string().optional(),
  machine_last_maintenance: z.string().nullable().optional(),
  machine_next_maintenance: z.string().nullable().optional(),
  maintenance_interval_months: z.number().int().min(1).max(120).nullable().optional(),
  tool_serial_no: z.string().nullable().optional(),
  tool_condition: z.enum(['good', 'worn', 'damaged']).nullable().optional(),
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

  const { data: asset } = await supabase
    .from('assets')
    .select('id, type')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, status, notes, location_id, license_plate, mileage, tuv_date,
    last_maintenance_at, next_maintenance_at, serial_no, manufacturer,
    machine_last_maintenance, machine_next_maintenance, maintenance_interval_months,
    tool_serial_no, tool_condition } = parsed.data

  if (name || status || notes !== undefined || location_id !== undefined) {
    await supabase
      .from('assets')
      .update({
        ...(name && { name }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(location_id !== undefined && { location_id }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
  }

  if (asset.type === 'vehicle' && (license_plate || mileage !== undefined || tuv_date !== undefined || last_maintenance_at !== undefined || next_maintenance_at !== undefined)) {
    await supabase
      .from('vehicles')
      .update({ license_plate, mileage, tuv_date, last_maintenance_at, next_maintenance_at })
      .eq('asset_id', id)
  }

  if (asset.type === 'machine' && (serial_no !== undefined || manufacturer !== undefined || machine_last_maintenance !== undefined || machine_next_maintenance !== undefined || maintenance_interval_months !== undefined)) {
    let computedNext = machine_next_maintenance
    if (!computedNext && machine_last_maintenance && maintenance_interval_months) {
      const d = new Date(machine_last_maintenance)
      d.setMonth(d.getMonth() + maintenance_interval_months)
      computedNext = d.toISOString().slice(0, 10)
    }
    await supabase
      .from('machines')
      .update({ serial_no, manufacturer, last_maintenance: machine_last_maintenance, next_maintenance: computedNext, maintenance_interval_months })
      .eq('asset_id', id)
  }

  if (asset.type === 'tool' && (tool_serial_no !== undefined || tool_condition !== undefined)) {
    await supabase
      .from('tools')
      .update({ serial_no: tool_serial_no, condition: tool_condition })
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

