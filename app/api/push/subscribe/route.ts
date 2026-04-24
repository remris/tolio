import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getEmployeeSession } from '@/lib/auth/employee-session'
import { getSessionUser } from '@/lib/auth/permissions'
import { z } from 'zod'

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Subscription.' }, { status: 400 })
  }

  const employee = await getEmployeeSession()
  const admin = await getSessionUser()
  const sessionUser = employee ?? admin

  if (!sessionUser) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  await supabase.from('push_subscriptions').upsert(
    {
      user_id: sessionUser.id,
      company_id: sessionUser.company_id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    { onConflict: 'endpoint' },
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const endpoint = body?.endpoint as string | undefined

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint fehlt.' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)

  return NextResponse.json({ ok: true })
}

