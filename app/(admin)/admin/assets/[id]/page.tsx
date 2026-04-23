import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import AssetForm from '@/components/admin/AssetForm'
import AssetQrCode from '@/components/admin/AssetQrCode'
import DeleteAssetButton from '@/components/admin/DeleteAssetButton'
import MaintenancePanel from '@/components/admin/MaintenancePanel'
import DueDateBadge from '@/components/shared/DueDateBadge'
import type { Asset, MaintenanceRecord } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

type LogEntry = {
  id: string
  action: string
  mileage: number | null
  note: string | null
  created_at: string
  users: { username: string } | null
}

export default async function AssetDetailPage({ params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) notFound()

  const supabase = await createClient()

  const [{ data: asset }, { data: logs }, { data: maintenance }] = await Promise.all([
    supabase
      .from('assets')
      .select('*, vehicles(*), machines(*), tools(*)')
      .eq('id', id)
      .eq('company_id', session.company_id)
      .single(),
    supabase
      .from('asset_logs')
      .select('id, action, mileage, note, created_at, users(username)')
      .eq('asset_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('maintenance_records')
      .select('id, performed_at, description, cost, next_due_at, created_at, users(username)')
      .eq('asset_id', id)
      .order('performed_at', { ascending: false }),
  ])

  if (!asset) notFound()

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{asset.name}</h1>
        <DeleteAssetButton assetId={asset.id} />
      </div>

      {asset.type === 'vehicle' && asset.vehicles && (
        <div className="flex flex-wrap gap-2">
          <DueDateBadge date={asset.vehicles.tuv_date} label="TÜV" />
          <DueDateBadge date={asset.vehicles.next_maintenance_at} label="Wartung" />
        </div>
      )}
      {asset.type === 'machine' && asset.machines?.next_maintenance && (
        <DueDateBadge date={asset.machines.next_maintenance} label="Wartung" />
      )}

      <div className="grid grid-cols-2 gap-6">
        <AssetForm asset={asset as Asset} />
        <AssetQrCode qrCode={asset.qr_code} assetId={asset.id} />
      </div>

      <MaintenancePanel assetId={asset.id} records={(maintenance ?? []) as unknown as MaintenanceRecord[]} />

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b font-semibold">Aktivitätslog</div>
        <ul className="divide-y">
          {logs?.map((log: LogEntry) => (
            <li key={log.id} className="px-4 py-2 text-sm">
              <div className="flex justify-between">
                <span>
                  <span className="font-medium">{log.users?.username ?? '–'}</span>
                  {' – '}{log.action === 'check_out' ? 'ausgecheckt' : 'eingecheckt'}
                  {log.mileage != null ? ` · ${log.mileage.toLocaleString('de-DE')} km` : ''}
                </span>
                <span className="text-gray-400">{new Date(log.created_at).toLocaleString('de-DE')}</span>
              </div>
              {log.note && <p className="text-gray-500 text-xs mt-0.5">📝 {log.note}</p>}
            </li>
          ))}
          {!logs?.length && (
            <li className="px-4 py-6 text-center text-gray-400 text-sm">Keine Einträge.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
