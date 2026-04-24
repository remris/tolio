import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data: company } = await supabase
    .from('companies')
    .select('stripe_customer_id')
    .eq('id', session.company_id)
    .single()

  if (!company?.stripe_customer_id) {
    return NextResponse.json({ error: 'Kein Stripe-Kunde vorhanden. Bitte zuerst ein Abo abschließen.' }, { status: 400 })
  }

  const stripe = getStripe()
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: `${origin}/admin/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}

