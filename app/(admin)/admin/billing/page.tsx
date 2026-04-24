import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default async function BillingPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, stripe_customer_id, subscription_status, subscription_ends_at')
    .eq('id', session.company_id)
    .single()

  if (!company) return <p className="text-red-500">Firma nicht gefunden.</p>

  const status = company.subscription_status ?? 'none'
  const endsAt = company.subscription_ends_at
    ? new Date(company.subscription_ends_at).toLocaleDateString('de-DE')
    : null

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    active: { label: 'Aktiv', color: 'text-green-700 bg-green-100', icon: <CheckCircle className="w-4 h-4" /> },
    trialing: { label: 'Testphase', color: 'text-blue-700 bg-blue-100', icon: <Clock className="w-4 h-4" /> },
    past_due: { label: 'Zahlung überfällig', color: 'text-red-700 bg-red-100', icon: <AlertCircle className="w-4 h-4" /> },
    canceled: { label: 'Gekündigt', color: 'text-gray-700 bg-gray-100', icon: <AlertCircle className="w-4 h-4" /> },
    none: { label: 'Kein Abo', color: 'text-gray-700 bg-gray-100', icon: <AlertCircle className="w-4 h-4" /> },
  }

  const cfg = statusConfig[status] ?? statusConfig['none']

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-sm text-gray-500 mt-1">Verwaltung deines Tolio-Abonnements</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{company.name}</p>
            <p className="text-xs text-gray-400">Tolio Subscription</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          {endsAt && (
            <span className="text-xs text-gray-400">
              {status === 'canceled' ? 'Endet am' : 'Verlängert am'}: {endsAt}
            </span>
          )}
        </div>

        {company.stripe_customer_id && (
          <div className="pt-2 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-1">Kunden-ID</p>
            <p className="text-sm font-mono text-gray-700">{company.stripe_customer_id}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Abo verwalten</h2>
        <p className="text-sm text-gray-500 mb-4">
          Für Änderungen an deinem Abonnement, Rechnungen oder Zahlungsmethoden wende dich an unseren Support.
        </p>
        <a
          href="mailto:support@tolio.app"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Support kontaktieren
        </a>
      </div>
    </div>
  )
}

