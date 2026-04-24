export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { CreditCard, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { getPlan } from '@/lib/stripe/plans'
import BillingPlans from '@/components/admin/BillingPlans'

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ success?: string; canceled?: string }> }) {
  const { success, canceled } = await searchParams
  const session = await getSessionUser()
  if (!session) redirect('/login')
  if (!session.is_admin) redirect('/admin/dashboard')

  const supabase = await createServiceClient()

  const [{ data: company }, { data: sub }, { count: assetCount }, { count: userCount }] = await Promise.all([
    supabase.from('companies').select('id, name, stripe_customer_id, plan').eq('id', session.company_id).single(),
    supabase.from('subscriptions').select('plan, status, current_period_end').eq('company_id', session.company_id).single(),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', session.company_id),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', session.company_id).eq('active', true),
  ])

  if (!company) return <p className="text-red-500">Firma nicht gefunden.</p>

  const planId = sub?.plan ?? company?.plan ?? 'starter'
  const plan = getPlan(planId)
  const status = sub?.status ?? 'trialing'
  const endsAt = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('de-DE')
    : null

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active:    { label: 'Aktiv',              color: 'text-green-700 bg-green-100 border-green-200',  icon: <CheckCircle className="w-4 h-4" /> },
    trialing:  { label: 'Testphase',          color: 'text-blue-700 bg-blue-100 border-blue-200',     icon: <Clock className="w-4 h-4" /> },
    past_due:  { label: 'Zahlung überfällig', color: 'text-red-700 bg-red-100 border-red-200',        icon: <AlertCircle className="w-4 h-4" /> },
    canceled:  { label: 'Gekündigt',          color: 'text-gray-700 bg-gray-100 border-gray-200',     icon: <AlertCircle className="w-4 h-4" /> },
    none:      { label: 'Kein Abo',           color: 'text-gray-700 bg-gray-100 border-gray-200',     icon: <AlertCircle className="w-4 h-4" /> },
  }
  const cfg = statusConfig[status] ?? statusConfig['none']

  const assetUsed = assetCount ?? 0
  const userUsed = userCount ?? 0
  const assetPct = plan.assetLimit === -1 ? 0 : Math.min(100, Math.round((assetUsed / plan.assetLimit) * 100))
  const userPct = plan.userLimit === -1 ? 0 : Math.min(100, Math.round((userUsed / plan.userLimit) * 100))

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement & Abrechnung</h1>
        <p className="text-sm text-gray-500 mt-1">Deinen Tolio-Plan verwalten</p>
      </div>

      {success === '1' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Abonnement erfolgreich aktiviert!
        </div>
      )}
      {canceled === '1' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm font-medium">
          Checkout abgebrochen – keine Änderungen vorgenommen.
        </div>
      )}

      {/* Current plan status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-wrap gap-4 items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{plan.name}-Plan</p>
            <p className="text-xs text-gray-400">{company.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.color}`}>
            {cfg.icon}{cfg.label}
          </span>
          {endsAt && (
            <span className="text-xs text-gray-400">
              {status === 'canceled' ? 'Endet' : 'Verlängert'}: {endsAt}
            </span>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <p className="font-semibold text-gray-900 text-sm">Nutzung</p>
        </div>
        <UsageBar
          label="Assets"
          used={assetUsed}
          limit={plan.assetLimit}
          pct={assetPct}
        />
        <UsageBar
          label="Mitarbeiter"
          used={userUsed}
          limit={plan.userLimit}
          pct={userPct}
        />
      </div>

      {/* Plans */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Plan auswählen</h2>
        <BillingPlans
          currentPlan={planId}
          hasStripeCustomer={!!company.stripe_customer_id}
        />
      </div>
    </div>
  )
}

function UsageBar({ label, used, limit, pct }: { label: string; used: number; limit: number; pct: number }) {
  const unlimited = limit === -1
  const danger = !unlimited && pct >= 90
  const warning = !unlimited && pct >= 70

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${danger ? 'text-red-600' : 'text-gray-700'}`}>
          {used} / {unlimited ? '∞' : limit}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${danger ? 'bg-red-500' : warning ? 'bg-amber-400' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {unlimited && (
        <div className="h-2 bg-indigo-100 rounded-full">
          <div className="h-full w-full bg-indigo-400 rounded-full opacity-40" />
        </div>
      )}
    </div>
  )
}
