'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Asset } from '@/lib/types'

interface Props {
  asset?: Asset
}

export default function AssetForm({ asset }: Props) {
  const router = useRouter()
  const isEdit = !!asset

  const [form, setForm] = useState({
    name: asset?.name ?? '',
    type: asset?.type ?? 'tool',
    status: asset?.status ?? 'available',
    notes: asset?.notes ?? '',
    license_plate: (asset as any)?.vehicles?.license_plate ?? '',
    mileage: (asset as any)?.vehicles?.mileage ?? 0,
    tuv_date: (asset as any)?.vehicles?.tuv_date ?? '',
    last_maintenance_at: (asset as any)?.vehicles?.last_maintenance_at ?? '',
    next_maintenance_at: (asset as any)?.vehicles?.next_maintenance_at ?? '',
    serial_no: (asset as any)?.machines?.serial_no ?? '',
    manufacturer: (asset as any)?.machines?.manufacturer ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
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

    router.push('/admin/assets')
    router.refresh()
  }

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
        </>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
        {loading ? 'Speichern...' : isEdit ? 'Speichern' : 'Asset anlegen'}
      </button>
    </form>
  )
}

const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black'

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

