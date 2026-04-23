import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { assetTypeLabel } from '@/lib/utils'
import DueDateBadge from '@/components/shared/DueDateBadge'
import ExportButtons from '@/components/admin/ExportButtons'

export default async function DashboardPage() {
  const session = await getSessionUser()
  const supabase = await createClient()

  const companyId = session!.company_id

  const warningDate = new Date()
  warningDate.setDate(warningDate.getDate() + 30)
  const warningIso = warningDate.toISOString().slice(0, 10)

  const [
    { count: totalAssets },
    { count: inUse },
    { count: broken },
    { count: maintenance },
    { data: recentLogs },
    { data: company },
    { data: currentCheckouts },
    { data: dueSoon },
  ] = await Promise.all([
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'in_use'),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'broken'),
    supabase.from('assets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'maintenance'),
    supabase
      .from('asset_logs')
      .select('id, action, created_at, assets(name, type), users(username)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('companies').select('name, code').eq('id', companyId).single(),
    // Assets currently checked out (in_use) with who has them
    supabase
      .from('assets')
      .select('id, name, type, updated_at, vehicles(assigned_user_id, users(username))')
      .eq('company_id', companyId)
      .eq('status', 'in_use')
      .order('updated_at', { ascending: false })
      .limit(10),
    // Assets with maintenance/TÜV due within 30 days
    supabase
      .from('assets')
      .select('id, name, type, vehicles(tuv_date, next_maintenance_at), machines(next_maintenance)')
      .eq('company_id', companyId)
      .or(`vehicles.tuv_date.lte.${warningIso},vehicles.next_maintenance_at.lte.${warningIso},machines.next_maintenance.lte.${warningIso}`)
      .limit(10),
  ])

  const stats = [
    { label: 'Gesamt Assets', value: totalAssets ?? 0, color: 'text-black' },
    { label: 'In Verwendung', value: inUse ?? 0, color: 'text-yellow-600' },
    { label: 'Defekt', value: broken ?? 0, color: 'text-red-600' },
    { label: 'In Wartung', value: maintenance ?? 0, color: 'text-blue-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <ExportButtons />
      </div>

      {company && (
        <div className="bg-black text-white rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Firmencode für Mitarbeiter</p>
            <p className="text-3xl font-bold tracking-widest mt-1">{company.code}</p>
          </div>
          <p className="text-sm text-gray-400">{company.name}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current checkouts */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b font-semibold">📤 Aktuelle Ausleihen</div>
          <ul className="divide-y">
            {currentCheckouts?.map((a: any) => (
              <li key={a.id} className="px-4 py-3 flex justify-between text-sm">
                <span>
                  <a href={`/admin/assets/${a.id}`} className="font-medium underline">{a.name}</a>
                  <span className="text-gray-400 ml-1">({assetTypeLabel(a.type)})</span>
                </span>
                <span className="text-gray-500">
                  {a.vehicles?.users?.username ?? '–'}
                </span>
              </li>
            ))}
            {!currentCheckouts?.length && (
              <li className="px-4 py-6 text-center text-gray-400 text-sm">Keine aktiven Ausleihen.</li>
            )}
          </ul>
        </div>

        {/* Due soon */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b font-semibold">⚠️ Bald fällig (30 Tage)</div>
          <ul className="divide-y">
            {dueSoon?.map((a: any) => (
              <li key={a.id} className="px-4 py-3 text-sm space-y-1">
                <a href={`/admin/assets/${a.id}`} className="font-medium underline">{a.name}</a>
                <div className="flex flex-wrap gap-1.5">
                  {a.vehicles?.tuv_date && <DueDateBadge date={a.vehicles.tuv_date} label="TÜV" />}
                  {a.vehicles?.next_maintenance_at && <DueDateBadge date={a.vehicles.next_maintenance_at} label="Wartung" />}
                  {a.machines?.next_maintenance && <DueDateBadge date={a.machines.next_maintenance} label="Wartung" />}
                </div>
              </li>
            ))}
            {!dueSoon?.length && (
              <li className="px-4 py-6 text-center text-gray-400 text-sm">Keine fälligen Termine.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b font-semibold">Letzte Aktivitäten</div>
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
