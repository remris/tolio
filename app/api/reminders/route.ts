import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { sendPushNotification } from '@/lib/push/client'

async function sendPushToCompany(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  companyId: string,
  title: string,
  body: string,
  url: string,
) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('company_id', companyId)
  for (const sub of subs ?? []) {
    try { await sendPushNotification(sub, { title, body, url }) } catch {}
  }
}

async function sendReminder(
  to: string,
  companyName: string,
  assetName: string,
  dueDate: string,
  type: 'tuv' | 'maintenance',
) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.EMAIL_FROM ?? 'Tolio <noreply@tolio.app>'
  const label = type === 'tuv' ? 'TÜV' : 'Wartung'
  await resend.emails.send({
    from,
    to,
    subject: `[Tolio] ${label} fällig: ${assetName}`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>⚠️ ${label} Erinnerung</h2>
      <p>Asset <strong>${assetName}</strong> (${companyName}) hat eine fällige ${label} am <strong>${dueDate}</strong>.</p>
    </div>`,
  })
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const today = new Date().toISOString().slice(0, 10)
  const warnDate = new Date()
  warnDate.setDate(warnDate.getDate() + 14)
  const warnIso = warnDate.toISOString().slice(0, 10)

  let sent = 0
  const errors: string[] = []

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('tuv_date, next_maintenance_at, assets(id, name, company_id)')

  for (const v of vehicles ?? []) {
    const asset = (v as any).assets
    if (!asset) continue

    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('company_id', asset.company_id)
      .not('email', 'is', null)
      .not('auth_id', 'is', null)
      .limit(3)

    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', asset.company_id)
      .single()

    const emails = (admins ?? []).map((u: any) => u.email).filter(Boolean)
    if (!emails.length) continue

    if (v.tuv_date && v.tuv_date >= today && v.tuv_date <= warnIso) {
      for (const email of emails) {
        try { await sendReminder(email, company?.name ?? '', asset.name, formatDate(v.tuv_date), 'tuv'); sent++ }
        catch (e: any) { errors.push(e.message) }
      }
      await sendPushToCompany(supabase, asset.company_id, '⚠️ TÜV fällig', `${asset.name} – TÜV am ${formatDate(v.tuv_date)}`, '/dashboard')
    }

    if (v.next_maintenance_at && v.next_maintenance_at >= today && v.next_maintenance_at <= warnIso) {
      for (const email of emails) {
        try { await sendReminder(email, company?.name ?? '', asset.name, formatDate(v.next_maintenance_at), 'maintenance'); sent++ }
        catch (e: any) { errors.push(e.message) }
      }
      await sendPushToCompany(supabase, asset.company_id, '⚠️ Wartung fällig', `${asset.name} – Wartung am ${formatDate(v.next_maintenance_at)}`, '/dashboard')
    }
  }

  const { data: machines } = await supabase
    .from('machines')
    .select('next_maintenance, assets(id, name, company_id)')

  for (const m of machines ?? []) {
    const asset = (m as any).assets
    if (!asset || !m.next_maintenance) continue
    if (m.next_maintenance < today || m.next_maintenance > warnIso) continue

    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('company_id', asset.company_id)
      .not('email', 'is', null)
      .not('auth_id', 'is', null)
      .limit(3)

    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', asset.company_id)
      .single()

    const emails = (admins ?? []).map((u: any) => u.email).filter(Boolean)
    for (const email of emails) {
      try { await sendReminder(email, company?.name ?? '', asset.name, formatDate(m.next_maintenance), 'maintenance'); sent++ }
      catch (e: any) { errors.push(e.message) }
    }
    await sendPushToCompany(supabase, asset.company_id, '⚠️ Wartung fällig', `${asset.name} – Wartung am ${formatDate(m.next_maintenance)}`, '/dashboard')
  }

  return NextResponse.json({ ok: true, sent, errors })
}

