'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AssetStatus, AssetType } from '@/lib/types'
import { CheckCircle, XCircle, LogOut, LogIn, AlertTriangle, WifiOff } from 'lucide-react'
import PhotoPicker from './PhotoPicker'
import { enqueueAction } from '@/lib/offline/queue'

interface Props {
  assetId: string
  status: AssetStatus
  assetType: AssetType
  currentMileage?: number | null
  currentUserId?: string | null
  heldByUserId?: string | null
}

async function uploadPhotos(assetId: string, logId: string, photos: File[]) {
  if (!photos.length || !logId) return
  const fd = new FormData()
  photos.forEach(f => fd.append('photos', f))
  await fetch(`/api/assets/${assetId}/log-photos?log_id=${logId}`, { method: 'POST', body: fd })
}

export default function CheckActions({ assetId, status, assetType, currentMileage, currentUserId, heldByUserId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'checkin' | 'checkout' | 'broken' | null>(null)
  const [mileage, setMileage] = useState('')
  const [fuelStatus, setFuelStatus] = useState('')
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [showBrokenForm, setShowBrokenForm] = useState(false)
  const [brokenNote, setBrokenNote] = useState('')
  const [brokenPhotos, setBrokenPhotos] = useState<File[]>([])
  const [brokenPreviews, setBrokenPreviews] = useState<string[]>([])

  const isVehicle = assetType === 'vehicle'
  const isTool = assetType === 'tool'
  const canReturn = status === 'in_use' && (!heldByUserId || !currentUserId || heldByUserId === currentUserId)
  const isMyCheckout = status === 'in_use' && heldByUserId && currentUserId && heldByUserId === currentUserId

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50'

  async function handle(action: 'checkin' | 'checkout') {
    if (isVehicle && action === 'checkin' && !mileage) {
      setError('Kilometerstand ist beim Zurückgeben Pflicht.')
      return
    }
    setLoading(true)
    setError(null)
    const body: Record<string, unknown> = {}
    if (note) body.note = note
    if (isVehicle && mileage) body.mileage = parseInt(mileage, 10)
    if (isVehicle && action === 'checkin' && fuelStatus) body.fuel_status = fuelStatus

    const endpoint = `/api/assets/${assetId}/${action === 'checkout' ? 'checkout' : 'checkin'}`
    const label = action === 'checkout' ? 'Auschecken' : 'Zurückgeben'

    // Offline: queue the action
    if (!navigator.onLine) {
      await enqueueAction({ url: endpoint, method: 'POST', body: JSON.stringify(body), label })
      setDone(action)
      setLoading(false)
      setTimeout(() => router.push('/pwa/assets'), 1500)
      return
    }

    let res: Response
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      // Network error – queue for later
      await enqueueAction({ url: endpoint, method: 'POST', body: JSON.stringify(body), label })
      setDone(action)
      setLoading(false)
      setTimeout(() => router.push('/pwa/assets'), 1500)
      return
    }

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler.'); setLoading(false); return }

    if (data.log_id && photos.length > 0) {
      await uploadPhotos(assetId, data.log_id, photos)
    }

    setDone(action)
    setLoading(false)
    router.refresh()
    setTimeout(() => { router.refresh(); router.push('/pwa/assets') }, 1200)
  }

  async function handleBroken() {
    if (!brokenNote.trim()) { setError('Bitte Defekt-Beschreibung eingeben.'); return }
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/assets/${assetId}/broken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: brokenNote }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler.'); setLoading(false); return }

    if (data.log_id && brokenPhotos.length > 0) {
      await uploadPhotos(assetId, data.log_id, brokenPhotos)
    }

    setDone('broken')
    setLoading(false)
    router.refresh()
    setTimeout(() => { router.refresh(); router.push('/pwa/assets') }, 1200)
  }

  if (done) {
    const queued = !navigator.onLine
    return (
      <div className="text-center py-6 space-y-3">
        {done === 'broken'
          ? <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          : queued
            ? <WifiOff className="w-12 h-12 text-amber-400 mx-auto" />
            : <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />}
        <p className="font-semibold text-gray-900">
          {done === 'checkout' ? 'Ausgecheckt!' : done === 'checkin' ? 'Eingecheckt!' : 'Defekt gemeldet!'}
          {queued && ' (wird synchronisiert)'}
        </p>
        <p className="text-sm text-gray-500">Weiterleitung…</p>
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

  if (status === 'in_use' && !canReturn) {
    return (
      <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <span>Nur die Person, die ausgecheckt hat, kann zurückgeben.</span>
      </div>
    )
  }

  if (showBrokenForm) {
    return (
      <div className="space-y-4">
        <p className="font-semibold text-red-600 text-xs uppercase tracking-wider">Defekt melden</p>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Beschreibung *</label>
          <textarea
            value={brokenNote}
            onChange={e => setBrokenNote(e.target.value)}
            placeholder="Was ist kaputt? z. B. Kabel gerissen, Akku defekt…"
            rows={3}
            className={inputCls + ' resize-none'}
          />
        </div>
        <PhotoPicker
          photos={brokenPhotos}
          previews={brokenPreviews}
          onChange={(p, pv) => { setBrokenPhotos(p); setBrokenPreviews(pv) }}
        />
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleBroken} disabled={loading} className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {loading ? 'Bitte warten…' : 'Als defekt melden'}
          </button>
          <button onClick={() => { setShowBrokenForm(false); setError(null) }} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
        {status === 'available' ? 'Asset auschecken' : 'Asset zurückgeben'}
      </p>

      {isVehicle && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Kilometerstand{status === 'in_use' ? ' (Pflicht)' : ''}{currentMileage != null ? ` – aktuell: ${currentMileage.toLocaleString('de-DE')} km` : ''}
            </label>
            <input type="number" min={currentMileage ?? 0} value={mileage} onChange={e => setMileage(e.target.value)} placeholder="km eingeben…" className={inputCls} />
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
          placeholder={status === 'in_use' ? 'z. B. Zustand beim Zurückgeben…' : 'z. B. Baustelle Nord…'}
          className={inputCls}
        />
      </div>

      <PhotoPicker
        photos={photos}
        previews={photoPreviews}
        onChange={(p, pv) => { setPhotos(p); setPhotoPreviews(pv) }}
      />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {status === 'available' && (
        <button onClick={() => handle('checkout')} disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" />
          {loading ? 'Bitte warten…' : 'Auschecken'}
        </button>
      )}

      {status === 'in_use' && canReturn && (
        <div className="space-y-2">
          <button onClick={() => handle('checkin')} disabled={loading} className="w-full bg-green-600 text-white py-3.5 rounded-xl text-base font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" />
            {loading ? 'Bitte warten…' : 'Zurückgeben'}
          </button>
          {isTool && isMyCheckout && (
            <button onClick={() => setShowBrokenForm(true)} className="w-full border border-red-200 text-red-600 py-3 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Als defekt melden
            </button>
          )}
        </div>
      )}
    </div>
  )
}

