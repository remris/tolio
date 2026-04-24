import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { z } from 'zod'

export async function GET() {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, code, created_at')
    .eq('id', session.company_id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

const schema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, - und _ erlaubt').optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('companies')
    .update(parsed.data)
    .eq('id', session.company_id)
    .select('id, name, code')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Firmencode bereits vergeben.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

