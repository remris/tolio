'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Loader2 } from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

interface Props {
  currentPlan: string
  hasStripeCustomer: boolean
}

export default function BillingPlans({ currentPlan, hasStripeCustomer }: Props) {
  const router = useRouter()
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(planId: PlanId) {
    if (planId === currentPlan) return
    setLoading(planId)
    setError(null)

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Fehler.'); setLoading(null); return }
      router.push(data.url)
    } catch {
      setError('Verbindungsfehler.')
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Fehler.'); setLoading(null); return }
      router.push(data.url)
    } catch {
      setError('Verbindungsfehler.')
      setLoading(null)
    }
  }

  const plans = Object.values(PLANS)

  return (
    <div className="space-y-6">
      {/* Interval toggle */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['monthly', 'yearly'] as const).map((iv) => (
          <button
            key={iv}
            onClick={() => setInterval(iv)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${interval === iv ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            {iv === 'monthly' ? 'Monatlich' : 'Jährlich'}
            {iv === 'yearly' && <span className="ml-1.5 text-xs text-green-600 font-semibold">–2 Monate</span>}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const price = interval === 'yearly' ? plan.priceYearly : plan.priceMonthly
          const perMonth = interval === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly
          const isLoading = loading === plan.id

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
                plan.popular
                  ? 'border-indigo-600 shadow-lg shadow-indigo-100'
                  : isCurrent
                    ? 'border-green-400'
                    : 'border-gray-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Empfohlen
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Aktuell
                  </span>
                </div>
              )}

              <div>
                <p className="font-bold text-gray-900 text-lg">{plan.name}</p>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">€{perMonth}</span>
                  <span className="text-gray-400 text-sm">/Monat</span>
                </div>
                {interval === 'yearly' && (
                  <p className="text-xs text-gray-400 mt-0.5">€{price} / Jahr abgerechnet</p>
                )}
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={isCurrent || !!loading}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isCurrent
                    ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                    : plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCurrent ? 'Aktiver Plan' : `Wechseln zu ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Billing portal */}
      {hasStripeCustomer && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900">Rechnungen & Zahlungsmethoden</p>
            <p className="text-sm text-gray-500">Rechnungshistorie, Zahlungsmethode ändern, Abo kündigen</p>
          </div>
          <button
            onClick={handlePortal}
            disabled={!!loading}
            className="shrink-0 flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading === 'portal' && <Loader2 className="w-4 h-4 animate-spin" />}
            Stripe Portal öffnen
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}
    </div>
  )
}

