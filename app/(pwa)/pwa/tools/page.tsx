'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, X } from 'lucide-react'
import { assetStatusLabel } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  type: 'tool' | 'machine' | 'vehicle'
  status: 'available' | 'in_use' | 'broken' | 'maintenance'
  qr_code: string | null
}

const statusBadge: Record<string, string> = {
  available: 'bg-green-100 text-green-700 border border-green-200',
  in_use: 'bg-blue-100 text-blue-700 border border-blue-200',
  broken: 'bg-red-100 text-red-600 border border-red-200',
  maintenance: 'bg-amber-100 text-amber-700 border border-amber-200',
}
const statusDot: Record<string, string> = {
  available: 'bg-green-500',
  in_use: 'bg-blue-500',
  broken: 'bg-red-500',
  maintenance: 'bg-amber-500',
}

export default function PwaToolsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [canCreate, setCanCreate] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'tool', notes: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(me => {
      if (me?.permissions?.includes('assets.create')) setCanCreate(true)
    })
    loadAssets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadAssets() {
    setLoading(true)
    fetch('/api/assets')
      .then(r => r.ok ? r.json() : [])
      .then(d => setAssets(d ?? []))
      .finally(() => setLoading(false))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name ist erforderlich.'); return }
    setSaving(true)
    setFormError('')
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, type: form.type, notes: form.notes || undefined }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setFormError(typeof data.error === 'string' ? data.error : 'Fehler'); return }
    setShowModal(false)
    setForm({ name: '', type: 'tool', notes: '' })
    loadAssets()
  }

  const filtered = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-5 pb-4 bg-gray-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tools</h1>
            <p className="text-gray-500 text-sm mt-0.5">{assets.length} items in inventory</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> New tool
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID"
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="mx-4 mt-4 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-4">
        <div className="grid grid-cols-[1fr_auto] px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</span>
        </div>
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 px-4 py-3 flex items-center"><div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" /></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">Keine Assets gefunden</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(asset => (
              <Link
                key={asset.id}
                href={`/pwa/asset/${asset.qr_code ?? asset.id}`}
                className="grid grid-cols-[1fr_auto] items-center px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100"
              >
                <span className="text-sm text-gray-800 font-medium pr-3">{asset.name}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadge[asset.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[asset.status] ?? 'bg-gray-400'}`} />
                  {assetStatusLabel(asset.status)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add a new tool</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Name *</label>
                <input autoFocus required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bosch GBH 2-26 hammer drill" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Typ</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                  <option value="tool">Werkzeug</option>
                  <option value="machine">Maschine</option>
                  <option value="vehicle">Fahrzeug</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} />
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Speichern…' : 'Add tool'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

