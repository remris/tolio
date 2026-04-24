import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { PLANS, type PlanId } from '@/lib/stripe/plans'
import { z } from 'zod'

const schema = z.object({
  planId: z.enum(['starter', 'pro']),
  interval: z.enum(['monthly', 'yearly']).default('monthly'),
})

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { planId, interval } = parsed.data
  const plan = PLANS[planId as PlanId]
  const priceId = interval === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly

  if (!priceId) {
    return NextResponse.json({ error: `Stripe Price ID für Plan "${planId}" nicht konfiguriert.` }, { status: 500 })
  }

  const supabase = await createServiceClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, stripe_customer_id')
    .eq('id', session.company_id)
    .single()

  if (!company) return NextResponse.json({ error: 'Firma nicht gefunden.' }, { status: 404 })

  const stripe = getStripe()
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Create or reuse Stripe customer
  let customerId = company.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: company.name,
      metadata: { company_id: company.id },
    })
    customerId = customer.id
    await supabase
      .from('companies')
      .update({ stripe_customer_id: customerId })
      .eq('id', company.id)
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { company_id: company.id, plan: planId },
    },
    success_url: `${origin}/admin/billing?success=1`,
    cancel_url: `${origin}/admin/billing?canceled=1`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })

  return NextResponse.json({ url: checkoutSession.url })
}

