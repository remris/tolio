'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AssetStatus, AssetType } from '@/lib/types'

interface Props {
  assetId: string
  status: AssetStatus
  assetType: AssetType
  currentMileage?: number | null
}

export default function CheckActions({ assetId, status, assetType, currentMileage }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mileage, setMileage] = useState<string>('')
  const [fuelStatus, setFuelStatus] = useState<string>('')
  const [note, setNote] = useState<string>('')

  const isVehicle = assetType === 'vehicle'

  async function handle(action: 'checkin' | 'checkout') {
    setLoading(true)
    setError(null)

    const body: Record<string, unknown> = {}
    if (note) body.note = note
    if (isVehicle && mileage) body.mileage = parseInt(mileage, 10)
    if (isVehicle && action === 'checkin' && fuelStatus) body.fuel_status = fuelStatus

    const res = await fetch(`/api/assets/${assetId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler.'); setLoading(false); return }
    router.refresh()
    setLoading(false)
  }

  if (status !== 'available' && status !== 'in_use') {
    return <p className="text-center text-sm text-gray-500">Kein Check-in/out möglich ({status}).</p>
  }

  return (
    <div className="space-y-3">
      {isVehicle && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Kilometerstand {currentMileage != null ? `(aktuell: ${currentMileage.toLocaleString('de-DE')} km)` : ''}
            </label>
            <input
              type="number"
              min={currentMileage ?? 0}
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="km eingeben…"
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          {status === 'in_use' && (
            <div>
              <label className="block text-sm font-medium mb-1">Tankstatus</label>
              <select
                value={fuelStatus}
                onChange={(e) => setFuelStatus(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">– nicht angegeben –</option>
                <option value="full">Voll</option>
                <option value="three_quarter">¾</option>
                <option value="half">½</option>
                <option value="quarter">¼</option>
                <option value="empty">Leer</option>
              </select>
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Notiz (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="z. B. Schaden bemerkt…"
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {status === 'available' && (
        <button
          onClick={() => handle('checkout')}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl text-base font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '...' : '📤 Auschecken'}
        </button>
      )}
      {status === 'in_use' && (
        <button
          onClick={() => handle('checkin')}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '...' : '📥 Einchecken'}
        </button>
      )}

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  )
}
