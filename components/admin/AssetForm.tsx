'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Asset } from '@/lib/types'
import { ImagePlus, X } from 'lucide-react'

interface Props {
  asset?: Asset
  redirectTo?: string
}

export default function AssetForm({ asset, redirectTo }: Props) {
  const router = useRouter()
  const isEdit = !!asset
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = asset as any

  const [form, setForm] = useState({
    name: asset?.name ?? '',
    type: asset?.type ?? 'tool',
    status: asset?.status ?? 'available',
    notes: asset?.notes ?? '',
    license_plate: a?.vehicles?.license_plate ?? '',
    mileage: a?.vehicles?.mileage ?? 0,
    tuv_date: a?.vehicles?.tuv_date ?? '',
    last_maintenance_at: a?.vehicles?.last_maintenance_at ?? '',
    next_maintenance_at: a?.vehicles?.next_maintenance_at ?? '',
    serial_no: a?.machines?.serial_no ?? '',
    manufacturer: a?.machines?.manufacturer ?? '',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>(a?.photo_urls ?? [])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 3 - existingPhotos.length - photos.length
    const newFiles = files.slice(0, remaining)
    setPhotos(prev => [...prev, ...newFiles])
    setPhotoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removeNewPhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function removeExistingPhoto(url: string) {
    if (!asset) return
    await fetch(`/api/assets/${asset.id}/photos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    setExistingPhotos(prev => prev.filter(u => u !== url))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch(isEdit ? `/api/assets/${asset!.id}` : '/api/assets', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, mileage: Number(form.mileage) }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    const saved = await res.json()
    const assetId = isEdit ? asset!.id : saved.id

    // Upload new photos
    if (photos.length > 0 && assetId) {
      const fd = new FormData()
      photos.forEach(f => fd.append('photos', f))
      await fetch(`/api/assets/${assetId}/photos`, { method: 'POST', body: fd })
    }

    router.push(redirectTo ?? '/admin/assets')
    router.refresh()
  }

  const totalPhotos = existingPhotos.length + photos.length

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Name" required>
        <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
      </Field>

      {!isEdit && (
        <Field label="Typ">
          <select value={form.type} onChange={(e) => update('type', e.target.value)} className={inputCls}>
            <option value="tool">Werkzeug</option>
            <option value="machine">Maschine</option>
            <option value="vehicle">Fahrzeug</option>
          </select>
        </Field>
      )}

      <Field label="Status">
        <select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputCls}>
          <option value="available">Verfügbar</option>
          <option value="in_use">In Verwendung</option>
          <option value="broken">Defekt</option>
          <option value="maintenance">Wartung</option>
        </select>
      </Field>

      <Field label="Notizen">
        <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} className={inputCls} />
      </Field>

      {/* Photo upload */}
      <Field label="Fotos (max. 3)">
        <div className="flex gap-2 flex-wrap">
          {existingPhotos.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeExistingPhoto(url)} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {photoPreviews.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeNewPhoto(i)} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {totalPhotos < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
              <span className="text-xs mt-0.5">Foto</span>
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
      </Field>

      {(form.type === 'vehicle' || asset?.type === 'vehicle') && (
        <>
          <Field label="Kennzeichen" required>
            <input type="text" value={form.license_plate} onChange={(e) => update('license_plate', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Kilometerstand">
            <input type="number" min={0} value={form.mileage} onChange={(e) => update('mileage', e.target.value)} className={inputCls} />
          </Field>
          <Field label="TÜV bis">
            <input type="date" value={form.tuv_date} onChange={(e) => update('tuv_date', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Letzte Wartung">
            <input type="date" value={form.last_maintenance_at} onChange={(e) => update('last_maintenance_at', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Nächste Wartung">
            <input type="date" value={form.next_maintenance_at} onChange={(e) => update('next_maintenance_at', e.target.value)} className={inputCls} />
          </Field>
        </>
      )}

      {(form.type === 'machine' || asset?.type === 'machine') && (
        <>
          <Field label="Hersteller">
            <input type="text" value={form.manufacturer} onChange={(e) => update('manufacturer', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Seriennummer">
            <input type="text" value={form.serial_no} onChange={(e) => update('serial_no', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Letzte Wartung">
            <input type="date" value={form.machine_last_maintenance} onChange={(e) => update('machine_last_maintenance', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Nächste Wartung">
            <input type="date" value={form.machine_next_maintenance} onChange={(e) => update('machine_next_maintenance', e.target.value)} className={inputCls} />
          </Field>
        </>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {loading ? 'Speichern...' : isEdit ? 'Speichern' : 'Asset anlegen'}
      </button>
    </form>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

