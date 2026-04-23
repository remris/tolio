'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { MaintenanceRecord } from '@/lib/types'

interface Props {
  assetId: string
  records: MaintenanceRecord[]
}

const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-gray-600">{label}</label>
      {children}
    </div>
  )
}

export default function MaintenancePanel({ assetId, records }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    performed_at: new Date().toISOString().slice(0, 10),
    description: '',
    cost: '',
    next_due_at: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch(`/api/assets/${assetId}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performed_at: form.performed_at,
        description: form.description || null,
        cost: form.cost ? parseFloat(form.cost) : null,
        next_due_at: form.next_due_at || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler.')
      setLoading(false)
      return
    }

    setForm({ performed_at: new Date().toISOString().slice(0, 10), description: '', cost: '', next_due_at: '' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Wartungshistorie</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800"
        >
          + Wartung eintragen
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="p-4 border-b bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Durchgeführt am *">
              <input
                type="date"
                required
                value={form.performed_at}
                onChange={(e) => update('performed_at', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Nächste Fälligkeit">
              <input
                type="date"
                value={form.next_due_at}
                onChange={(e) => update('next_due_at', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Beschreibung">
            <input
              type="text"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="z. B. Ölwechsel, Inspektion…"
              className={inputCls}
            />
          </Field>
          <Field label="Kosten (€)">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.cost}
              onChange={(e) => update('cost', e.target.value)}
              className={inputCls}
            />
          </Field>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 rounded-lg text-sm border hover:bg-gray-100"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <ul className="divide-y">
        {records.map((r) => (
          <li key={r.id} className="px-4 py-3 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{r.description ?? 'Wartung'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(r.performed_at)}
                  {(r as any).user?.username ? ` · ${(r as any).user.username}` : ''}
                  {r.cost != null ? ` · ${Number(r.cost).toFixed(2)} €` : ''}
                </p>
              </div>
              {r.next_due_at && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  Nächste: {formatDate(r.next_due_at)}
                </span>
              )}
            </div>
          </li>
        ))}
        {!records.length && (
          <li className="px-4 py-6 text-center text-gray-400 text-sm">Keine Wartungen eingetragen.</li>
        )}
      </ul>
    </div>
  )
}

