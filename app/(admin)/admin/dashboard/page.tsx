import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ArrowRight, Wrench, AlertTriangle, Activity } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = await createClient()
  const companyId = session.company_id

  const [
    { count: totalAssets },
    { count: inUse },
    { count: maintenance },
    { count: broken },
    { data: company },
    { data: recentAssets },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'in_use'),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'maintenance'),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'broken'),
    supabase.from('companies').select('name').eq('id', companyId).single(),
    supabase.from('assets').select('id, name, status').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
    supabase.from('asset_logs').select('id, action, created_at, assets(name), users(username)').order('created_at', { ascending: false }).limit(6),
  ])

  type LogRow = { id: string; action: string; created_at: string; assets: { name: string } | null; users: { username: string } | null }

  const statusLabel: Record<string, { label: string; class: string }> = {
    available:   { label: 'Verfügbar',  class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    in_use:      { label: 'In Nutzung', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    maintenance: { label: 'Wartung',    class: 'bg-amber-50 text-amber-700 border-amber-200' },
    broken:      { label: 'Defekt',     class: 'bg-red-50 text-red-700 border-red-200' },
  }

  const stats = [
    { label: 'Assets gesamt', value: totalAssets ?? 0, icon: Package,       iconClass: 'text-gray-400' },
    { label: 'Aktuell ausgegeben', value: inUse ?? 0,       icon: Wrench,        iconClass: 'text-blue-400' },
    { label: 'Wartung fällig',     value: maintenance ?? 0, icon: AlertTriangle, iconClass: 'text-amber-400' },
    { label: 'Defekt',             value: broken ?? 0,      icon: Activity,      iconClass: 'text-red-400' },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{company?.name} · Übersicht Ihres Bestands.</p>
        </div>
        <Link
          href="/admin/assets"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Assets verwalten
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, iconClass }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{label}</p>
              <Icon className={`w-4 h-4 ${iconClass}`} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Zuletzt hinzugefügt */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900">Zuletzt hinzugefügt</p>
            <Link href="/admin/assets" className="text-xs text-indigo-600 hover:underline">Alle anzeigen</Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {recentAssets?.map((a) => {
              const s = statusLabel[a.status] ?? statusLabel.available
              return (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between">
                  <Link href={`/admin/assets/${a.id}`} className="text-sm font-medium text-gray-800 hover:text-indigo-600 transition-colors">
                    {a.name}
                  </Link>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${s.class}`}>
                    • {s.label}
                  </span>
                </li>
              )
            })}
            {!recentAssets?.length && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">Noch keine Assets.</li>
            )}
          </ul>
        </div>

        {/* Letzte Aktivität */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900">Letzte Aktivität</p>
            <span className="text-xs text-gray-400">Alle anzeigen</span>
          </div>
          <ul className="divide-y divide-gray-50">
            {(recentLogs as LogRow[] | null)?.map((log) => (
              <li key={log.id} className="px-5 py-3 text-sm text-gray-600">
                <span className="font-medium text-gray-800">{log.users?.username ?? '–'}</span>
                {' '}{log.action === 'check_out' ? 'hat ausgecheckt' : 'hat eingecheckt'}:{' '}
                <span className="font-medium text-gray-800">{log.assets?.name ?? '–'}</span>
              </li>
            ))}
            {!recentLogs?.length && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">Noch keine Aktivität.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
