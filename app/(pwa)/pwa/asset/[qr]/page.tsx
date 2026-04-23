import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { assetStatusLabel, assetTypeLabel, formatDate, formatMileage } from '@/lib/utils'
import CheckActions from '@/components/pwa/CheckActions'

type Params = { params: Promise<{ qr: string }> }

export default async function AssetPwaPage({ params }: Params) {
  const { qr } = await params
  const supabase = await createServiceClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('*, vehicles(*), machines(*), tools(*)')
    .eq('qr_code', qr)
    .single()

  if (!asset) notFound()

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    in_use: 'bg-yellow-100 text-yellow-800',
    broken: 'bg-red-100 text-red-800',
    maintenance: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-gray-500 uppercase tracking-wide">{assetTypeLabel(asset.type)}</p>
        <h1 className="text-2xl font-bold">{asset.name}</h1>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[asset.status]}`}>
          {assetStatusLabel(asset.status)}
        </span>
      </div>

      {asset.type === 'vehicle' && asset.vehicles && (
        <div className="bg-white rounded-xl border p-4 space-y-2 text-sm">
          <Row label="Kennzeichen" value={asset.vehicles.license_plate} />
          <Row label="Kilometerstand" value={formatMileage(asset.vehicles.mileage)} />
          <Row label="TÜV bis" value={formatDate(asset.vehicles.tuv_date)} />
          <Row label="Letzte Wartung" value={formatDate(asset.vehicles.last_maintenance_at)} />
          <Row label="Nächste Wartung" value={formatDate(asset.vehicles.next_maintenance_at)} />
        </div>
      )}

      {asset.notes && (
        <div className="bg-white rounded-xl border p-4 text-sm text-gray-600">
          <p className="font-medium mb-1">Notizen</p>
          <p>{asset.notes}</p>
        </div>
      )}

      <CheckActions assetId={asset.id} status={asset.status} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

