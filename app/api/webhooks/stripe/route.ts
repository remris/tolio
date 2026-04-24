import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const companyId = sub.metadata?.company_id
      if (!companyId) break

      const plan = sub.metadata?.plan ?? 'starter'
      const priceId = (sub.items.data[0]?.price?.id) ?? null

      await supabase.from('subscriptions').upsert({
        company_id: companyId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        plan,
        status: sub.status,
        current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id' })

      // Keep companies.plan in sync
      await supabase.from('companies').update({ plan }).eq('id', companyId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const companyId = sub.metadata?.company_id
      if (!companyId) break

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', plan: 'starter', updated_at: new Date().toISOString() })
        .eq('company_id', companyId)

      await supabase.from('companies').update({ plan: 'starter' }).eq('id', companyId)
      break
    }

    case 'checkout.session.completed': {
      const cs = event.data.object as Stripe.Checkout.Session
      if (cs.mode !== 'subscription') break
      // Subscription events will handle the rest – just log
      break
    }
  }

  return NextResponse.json({ received: true })
}
