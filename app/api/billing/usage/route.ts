import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getPlan } from '@/lib/stripe/plans'

export async function GET() {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()

  const [
    { count: assetCount },
    { count: userCount },
    { data: sub },
  ] = await Promise.all([
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', session.company_id),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', session.company_id).eq('active', true),
    supabase.from('subscriptions').select('plan, status, current_period_end, stripe_subscription_id').eq('company_id', session.company_id).single(),
  ])

  const plan = getPlan(sub?.plan)

  return NextResponse.json({
    plan: plan.id,
    planName: plan.name,
    status: sub?.status ?? 'trialing',
    currentPeriodEnd: sub?.current_period_end ?? null,
    assetCount: assetCount ?? 0,
    assetLimit: plan.assetLimit,
    userCount: userCount ?? 0,
    userLimit: plan.userLimit,
  })
}

