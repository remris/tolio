import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth/permissions'
import { z } from 'zod'

const schema = z.object({
  performed_at: z.string().min(1),
  description: z.string().optional().nullable(),
  cost: z.number().optional().nullable(),
  next_due_at: z.string().optional().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  // Verify asset belongs to company
  const { data: asset } = await supabase
    .from('assets')
    .select('id')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('maintenance_records')
    .select('*, users(username)')
    .eq('asset_id', id)
    .order('performed_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { requirePermission(session, 'maintenance.manage') }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('id, type')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { performed_at, description, cost, next_due_at } = parsed.data

  // Insert maintenance record
  const { data: record, error } = await supabase
    .from('maintenance_records')
    .insert({ asset_id: id, user_id: session.id, performed_at, description, cost, next_due_at })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update asset last_maintenance_at and next_maintenance_at (vehicles/machines)
  const updates: Record<string, unknown> = {
    last_maintenance_at: performed_at,
    ...(next_due_at && { next_maintenance_at: next_due_at }),
  }

  if (asset.type === 'vehicle') {
    await supabase.from('vehicles').update(updates).eq('asset_id', id)
  } else if (asset.type === 'machine') {
    await supabase.from('machines').update({
      ...(next_due_at && { next_maintenance: next_due_at }),
    }).eq('asset_id', id)
  }

  // Auto-set status to available if it was maintenance
  await supabase
    .from('assets')
    .update({ status: 'available', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'maintenance')

  return NextResponse.json(record, { status: 201 })
}

