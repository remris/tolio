import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { assetStatusLabel, assetTypeLabel, formatMileage } from '@/lib/utils'
import CheckActions from '@/components/pwa/CheckActions'
import DueDateBadge from '@/components/shared/DueDateBadge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Params = { params: Promise<{ qr: string }> }

const fuelLabels: Record<string, string> = {
  full: 'Voll',
  three_quarter: '¾',
  half: '½',
  quarter: '¼',
  empty: 'Leer',
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-yellow-100 text-yellow-800',
  broken: 'bg-red-100 text-red-800',
  maintenance: 'bg-blue-100 text-blue-800',
}

export default async function AssetPwaPage({ params }: Params) {
  const { qr } = await params
  const supabase = await createServiceClient()

  // Try by qr_code first, then by id
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

  return (
    <div className="p-4 space-y-4">
      {/* Back button */}
      <Link href="/pwa/scan" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Zurück zum Scanner
      </Link>

      {/* Asset header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{assetTypeLabel(asset.type)}</p>
        <h1 className="text-xl font-bold text-gray-900">{asset.name}</h1>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[asset.status]}`}>
          {assetStatusLabel(asset.status)}
        </span>
      </div>

      {/* Vehicle details */}
      {asset.type === 'vehicle' && asset.vehicles && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 text-sm">
          <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Fahrzeugdaten</p>
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

      {/* Machine details */}
      {asset.type === 'machine' && asset.machines && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-2 text-sm">
          <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider">Maschinendaten</p>
          {asset.machines.manufacturer && <Row label="Hersteller" value={asset.machines.manufacturer} />}
          {asset.machines.serial_no && <Row label="Seriennr." value={asset.machines.serial_no} />}
          {asset.machines.next_maintenance && (
            <div className="pt-1">
              <DueDateBadge date={asset.machines.next_maintenance} label="Wartung" />
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {asset.notes && (
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-sm">
          <p className="font-semibold text-amber-800 mb-1 text-xs uppercase tracking-wider">Notizen</p>
          <p className="text-amber-900">{asset.notes}</p>
        </div>
      )}

      {/* Check in/out actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <CheckActions
          assetId={asset.id}
          status={asset.status}
          assetType={asset.type}
          currentMileage={asset.vehicles?.mileage ?? null}
        />
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

