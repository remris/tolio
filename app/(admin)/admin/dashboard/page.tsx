import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { assetStatusLabel, assetTypeLabel } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await getSessionUser()
  const supabase = await createClient()

  const [{ count: totalAssets }, { count: inUse }, { count: broken }, { data: recentLogs }, { data: company }] =
    await Promise.all([
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', session!.company_id),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', session!.company_id).eq('status', 'in_use'),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', session!.company_id).eq('status', 'broken'),
      supabase.from('asset_logs').select('id, action, created_at, assets(name, type), users(username)').order('created_at', { ascending: false }).limit(10),
      supabase.from('companies').select('name, code').eq('id', session!.company_id).single(),
    ])

  const stats = [
    { label: 'Gesamt Assets', value: totalAssets ?? 0 },
    { label: 'In Verwendung', value: inUse ?? 0 },
    { label: 'Defekt', value: broken ?? 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {company && (
        <div className="bg-black text-white rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Firmencode für Mitarbeiter</p>
            <p className="text-3xl font-bold tracking-widest mt-1">{company.code}</p>
          </div>
          <p className="text-sm text-gray-400">{company.name}</p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Letzte Aktivitäten</h2>
        </div>
        <ul className="divide-y">
          {recentLogs?.map((log: any) => (
            <li key={log.id} className="px-4 py-3 flex justify-between text-sm">
              <span>
                <span className="font-medium">{log.users?.username ?? '–'}</span>
                {' '}{log.action === 'check_out' ? 'hat ausgecheckt' : 'hat eingecheckt'}:{' '}
                <span className="font-medium">{log.assets?.name ?? '–'}</span>
                {' '}({assetTypeLabel(log.assets?.type ?? '')})
              </span>
              <span className="text-gray-400">
                {new Date(log.created_at).toLocaleString('de-DE')}
              </span>
            </li>
          ))}
          {!recentLogs?.length && (
            <li className="px-4 py-6 text-center text-gray-400 text-sm">Keine Aktivitäten vorhanden.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

