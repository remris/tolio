export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getAnySession } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import AssetQrCode from '@/components/admin/AssetQrCode'
import DeleteAssetButton from '@/components/admin/DeleteAssetButton'
import MaintenancePanel from '@/components/admin/MaintenancePanel'
import DueDateBadge from '@/components/shared/DueDateBadge'
import LogHistoryList from '@/components/pwa/LogHistoryList'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { assetStatusLabel, assetTypeLabel, formatMileage } from '@/lib/utils'
import type { MaintenanceRecord } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-blue-100 text-blue-800',
  broken: 'bg-red-100 text-red-800',
  maintenance: 'bg-amber-100 text-amber-800',
}

const fuelLabels: Record<string, string> = {
  full: 'Voll', three_quarter: '¾', half: '½', quarter: '¼', empty: 'Leer',
}

const conditionLabels: Record<string, string> = {
  good: 'Gut', worn: 'Verschlissen', damaged: 'Beschädigt',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-medium text-gray-900 text-sm">{value}</span>
    </div>
  )
}

export default async function AssetDetailPage({ params }: Params) {
  const { id } = await params
  const session = await getAnySession()
  if (!session) notFound()

  const supabase = await createClient()

  const [{ data: asset }, { data: logs }, { data: maintenance }] = await Promise.all([
    supabase
      .from('assets')
      .select('*, vehicles(*), machines(*), tools(*), locations(name)')
      .eq('id', id)
      .eq('company_id', session.company_id)
      .single(),
    supabase
      .from('asset_logs')
      .select('id, action, mileage, fuel_status, note, photo_urls, created_at, users(username)')
      .eq('asset_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('maintenance_records')
      .select('id, performed_at, description, cost, next_due_at, created_at, users(username)')
      .eq('asset_id', id)
      .order('performed_at', { ascending: false }),
  ])

  if (!asset) notFound()

  // Last checkout user
  let heldByUsername: string | null = null
  if (asset.status === 'in_use') {
    const { data: lastLog } = await supabase
      .from('asset_logs')
      .select('users(username)')
      .eq('asset_id', id)
      .eq('action', 'check_out')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    heldByUsername = (lastLog as any)?.users?.username ?? null
  }

  const photos: string[] = asset.photo_urls ?? []
  const a = asset as any

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link href="/admin/assets" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/assets/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Bearbeiten
          </Link>
          <DeleteAssetButton assetId={asset.id} />
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{assetTypeLabel(asset.type)}</p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
          <span className={`shrink-0 mt-1 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[asset.status] ?? 'bg-gray-100 text-gray-700'}`}>
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
            <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0 w-28 h-28 rounded-xl overflow-hidden border border-gray-100 block bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="object-cover w-full h-full"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </a>
          ))}
        </div>
      )}

      {/* General details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Allgemeine Details</p>
        <Row label="Status" value={assetStatusLabel(asset.status)} />
        {heldByUsername && <Row label="Ausgeliehen von" value={heldByUsername} />}
        {a.locations?.name && <Row label="Lagerort" value={a.locations.name} />}
        {asset.notes && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-0.5">Notizen</p>
            <p className="text-sm text-gray-900">{asset.notes}</p>
          </div>
        )}
      </div>

      {/* Vehicle data */}
      {asset.type === 'vehicle' && a.vehicles && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fahrzeugdaten</p>
          <Row label="Kennzeichen" value={a.vehicles.license_plate ?? '–'} />
          <Row label="Kilometerstand" value={formatMileage(a.vehicles.mileage)} />
          {a.vehicles.fuel_status && (
            <Row label="Tankstatus" value={fuelLabels[a.vehicles.fuel_status] ?? a.vehicles.fuel_status} />
          )}
          <div className="pt-2 space-y-2">
            <DueDateBadge date={a.vehicles.tuv_date} label="TÜV" />
            <DueDateBadge date={a.vehicles.next_maintenance_at} label="Wartung" />
          </div>
        </div>
      )}

      {/* Machine data */}
      {asset.type === 'machine' && a.machines && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Maschinendaten</p>
          {a.machines.manufacturer && <Row label="Hersteller" value={a.machines.manufacturer} />}
          {a.machines.serial_no && <Row label="Seriennr." value={a.machines.serial_no} />}
          {a.machines.maintenance_interval_months && (
            <Row label="Wartungsintervall" value={`${a.machines.maintenance_interval_months} Monate`} />
          )}
          {a.machines.next_maintenance && (
            <div className="pt-2">
              <DueDateBadge date={a.machines.next_maintenance} label="Wartung" />
            </div>
          )}
        </div>
      )}

      {/* Tool data */}
      {asset.type === 'tool' && a.tools && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Werkzeug-Details</p>
          {a.tools.serial_no && <Row label="Seriennr." value={a.tools.serial_no} />}
          {a.tools.condition && <Row label="Zustand" value={conditionLabels[a.tools.condition] ?? a.tools.condition} />}
        </div>
      )}

      {/* QR Code */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">QR-Code</p>
        <AssetQrCode qrCode={asset.qr_code} assetId={asset.id} assetName={asset.name} />
      </div>

      {/* Maintenance */}
      <MaintenancePanel assetId={asset.id} records={(maintenance ?? []) as unknown as MaintenanceRecord[]} />

      {/* Activity log */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="font-semibold text-gray-900 mb-3">Aktivitätslog</p>
        <LogHistoryList history={(logs ?? []) as unknown as Parameters<typeof LogHistoryList>[0]['history']} />
      </div>
    </div>
  )
}
