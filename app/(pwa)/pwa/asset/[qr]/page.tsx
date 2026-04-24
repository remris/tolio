import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'
import { notFound } from 'next/navigation'
import { assetStatusLabel, assetTypeLabel, formatMileage } from '@/lib/utils'
import CheckActions from '@/components/pwa/CheckActions'
import DueDateBadge from '@/components/shared/DueDateBadge'
import AssetDetailActions from '@/components/pwa/AssetDetailActions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

type Params = { params: Promise<{ qr: string }> }

const fuelLabels: Record<string, string> = {
  full: 'Voll', three_quarter: '¾', half: '½', quarter: '¼', empty: 'Leer',
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-blue-100 text-blue-800',
  broken: 'bg-red-100 text-red-800',
  maintenance: 'bg-amber-100 text-amber-800',
}

export default async function AssetPwaPage({ params }: Params) {
  const { qr } = await params
  const supabase = await createServiceClient()

  const adminSession = await getSessionUser()
  const session = adminSession ?? (await getEmployeeSession())

  let { data: asset } = await supabase
    .from('assets')
    .select('*, vehicles(*), machines(*), tools(*)')
    .eq('qr_code', qr)
    .single()

  if (!asset) {
    const { data: byId } = await supabase
      .from('assets')
      .select('*, vehicles(*), machines(*), tools(*)')
      .eq('id', qr)
      .single()
    asset = byId
  }

  if (!asset) notFound()

  // Get last checkout user info
  let heldByUser: { username: string } | null = null
  if (asset.status === 'in_use') {
    const { data: lastLog } = await supabase
      .from('asset_logs')
      .select('user_id, users(username)')
      .eq('asset_id', asset.id)
      .eq('action', 'check_out')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    heldByUser = (lastLog as any)?.users ?? null
  }

  // Get history
  const { data: history } = await supabase
    .from('asset_logs')
    .select('id, action, note, created_at, users(username)')
    .eq('asset_id', asset.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const permissions = session?.permissions ?? []
  const canDelete = permissions.includes('assets.delete')
  const canMaintain = permissions.includes('maintenance.manage')
  const canEdit = permissions.includes('assets.update')

  const photos: string[] = asset.photo_urls ?? []

  const supportsCheckout = asset.type === 'tool' || asset.type === 'vehicle'

  return (
    <div className="p-4 space-y-4">
      <Link href="/pwa/assets" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{assetTypeLabel(asset.type)}</p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900">{asset.name}</h1>
          <span className={`shrink-0 mt-0.5 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[asset.status]}`}>
            {assetStatusLabel(asset.status)}
          </span>
        </div>
        {asset.qr_code && (
          <p className="text-xs text-gray-400 mt-1">ID: {asset.qr_code.slice(0, 8).toUpperCase()}</p>
        )}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <div key={i} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-gray-100">
              <Image src={url} alt={`Foto ${i + 1}`} width={96} height={96} className="object-cover w-full h-full" />
            </div>
          ))}
        </div>
      )}

      {/* Vehicle data */}
      {asset.type === 'vehicle' && asset.vehicles && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3 text-sm">
          <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Fahrzeugdaten</p>
          <Row label="Kennzeichen" value={asset.vehicles.license_plate ?? '–'} />
          <Row label="Kilometerstand" value={formatMileage(asset.vehicles.mileage)} />
          {asset.vehicles.fuel_status && (
            <Row label="Tankstatus" value={fuelLabels[asset.vehicles.fuel_status] ?? asset.vehicles.fuel_status} />
          )}
          <div className="pt-1 space-y-1.5">
            <DueDateBadge date={asset.vehicles.tuv_date} label="TÜV" />
            <DueDateBadge date={asset.vehicles.next_maintenance_at} label="Wartung" />
          </div>
        </div>
      )}

      {/* Machine data */}
      {asset.type === 'machine' && asset.machines && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2 text-sm">
          <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Maschinendaten</p>
          {asset.machines.manufacturer && <Row label="Hersteller" value={asset.machines.manufacturer} />}
          {asset.machines.serial_no && <Row label="Seriennr." value={asset.machines.serial_no} />}
          {asset.machines.next_maintenance && (
            <div className="pt-1"><DueDateBadge date={asset.machines.next_maintenance} label="Wartung" /></div>
          )}
        </div>
      )}

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-sm space-y-3">
        <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Details</p>
        <Row label="Status" value={assetStatusLabel(asset.status)} />
        <Row label="Gehalten von" value={heldByUser?.username ?? '–'} />
        {asset.notes && (
          <div>
            <p className="text-gray-500 text-xs mb-0.5">Notizen</p>
            <p className="text-gray-900">{asset.notes}</p>
          </div>
        )}
      </div>

      {/* Checkout / Return */}
      {supportsCheckout && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <CheckActions
            assetId={asset.id}
            status={asset.status}
            assetType={asset.type}
            currentMileage={asset.vehicles?.mileage ?? null}
            currentUserId={session?.id ?? null}
            heldByUserId={null}
          />
        </div>
      )}

      {/* Admin actions */}
      {(canEdit || canMaintain || canDelete) && (
        <AssetDetailActions
          assetId={asset.id}
          canEdit={canEdit}
          canMaintain={canMaintain}
          canDelete={canDelete}
        />
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p className="font-semibold text-gray-900 mb-3">Verlauf</p>
        {!history || history.length === 0 ? (
          <p className="text-sm text-gray-400">Noch keine Aktivitäten.</p>
        ) : (
          <div className="space-y-2">
            {history.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${log.action === 'check_out' ? 'bg-amber-400' : 'bg-green-400'}`} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800">{log.action === 'check_out' ? 'Ausgecheckt' : 'Zurückgegeben'}</span>
                  <span className="text-gray-500"> von {log.users?.username ?? '–'}</span>
                  {log.note && <p className="text-xs text-gray-400 italic">„{log.note}"</p>}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {new Date(log.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

