'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AssetStatus, AssetType } from '@/lib/types'
import { CheckCircle, XCircle } from 'lucide-react'

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
  const [done, setDone] = useState<'checkin' | 'checkout' | null>(null)
  const [mileage, setMileage] = useState('')
  const [fuelStatus, setFuelStatus] = useState('')
  const [note, setNote] = useState('')

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
    if (!res.ok) {
      setError(data.error ?? 'Fehler.')
      setLoading(false)
      return
    }
    setDone(action)
    setLoading(false)
    setTimeout(() => router.push('/pwa/dashboard'), 1500)
  }

  if (done) {
    return (
      <div className="text-center py-6 space-y-3">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        <p className="font-semibold text-gray-900">
          {done === 'checkout' ? 'Erfolgreich ausgecheckt!' : 'Erfolgreich eingecheckt!'}
        </p>
        <p className="text-sm text-gray-500">Weiterleitung zur Übersicht…</p>
      </div>
    )
  }

  if (status !== 'available' && status !== 'in_use') {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
        <XCircle className="w-5 h-5 text-gray-400 shrink-0" />
        <span>Dieses Asset ist derzeit nicht verfügbar ({status}).</span>
      </div>
    )
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50'

  return (
    <div className="space-y-4">
      <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
        {status === 'available' ? 'Asset auschecken' : 'Asset einchecken'}
      </p>

      {isVehicle && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Kilometerstand {currentMileage != null ? `(aktuell: ${currentMileage.toLocaleString('de-DE')} km)` : ''}
            </label>
            <input
              type="number"
              min={currentMileage ?? 0}
              value={mileage}
              onChange={e => setMileage(e.target.value)}
              placeholder="km eingeben…"
              className={inputCls}
            />
          </div>
          {status === 'in_use' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Tankstatus</label>
              <select value={fuelStatus} onChange={e => setFuelStatus(e.target.value)} className={inputCls}>
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
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Notiz (optional)</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="z. B. kleiner Kratzer bemerkt…"
          className={inputCls}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {status === 'available' && (
        <button
          onClick={() => handle('checkout')}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Bitte warten…' : '📤 Auschecken'}
        </button>
      )}
      {status === 'in_use' && (
        <button
          onClick={() => handle('checkin')}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Bitte warten…' : '📥 Einchecken'}
        </button>
      )}
    </div>
  )
}

