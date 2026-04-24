'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Search, Filter, ArrowRight, Loader2, Plus, X, ImagePlus } from 'lucide-react'
import { assetTypeLabel, assetStatusLabel } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  type: 'tool' | 'machine' | 'vehicle'
  status: 'available' | 'in_use' | 'broken' | 'maintenance'
  qr_code: string | null
  photo_urls?: string[]
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-yellow-100 text-yellow-700',
  broken: 'bg-red-100 text-red-700',
  maintenance: 'bg-blue-100 text-blue-700',
}

const typeFilters = [
  { value: '', label: 'Alle' },
  { value: 'tool', label: 'Werkzeuge' },
  { value: 'machine', label: 'Maschinen' },
  { value: 'vehicle', label: 'Fahrzeuge' },
]

const statusFilters = [
  { value: '', label: 'Alle' },
  { value: 'available', label: 'Verfügbar' },
  { value: 'in_use', label: 'Ausgecheckt' },
]

export default function PwaAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [canCreate, setCanCreate] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'tool', notes: '', license_plate: '' })
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(me => {
      if (me?.permissions?.includes('assets.create')) setCanCreate(true)
    })
    loadAssets()
  }, [])

  function loadAssets() {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/assets?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setAssets(d ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAssets() }, [typeFilter, statusFilter])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 3 - photos.length
    const newFiles = files.slice(0, remaining)
    setPhotos(prev => [...prev, ...newFiles])
    setPhotoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name ist erforderlich.'); return }
    if (form.type === 'vehicle' && !form.license_plate.trim()) { setFormError('Kennzeichen ist erforderlich.'); return }
    setSaving(true)
    setFormError('')

    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        notes: form.notes || undefined,
        ...(form.type === 'vehicle' && { license_plate: form.license_plate }),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setFormError(typeof data.error === 'string' ? data.error : 'Fehler beim Anlegen.')
      setSaving(false)
      return
    }

    // Upload photos if any
    if (photos.length > 0) {
      const fd = new FormData()
      photos.forEach(f => fd.append('photos', f))
      await fetch(`/api/assets/${data.id}/photos`, { method: 'POST', body: fd })
    }

    setSaving(false)
    setShowModal(false)
    setForm({ name: '', type: 'tool', notes: '', license_plate: '' })
    setPhotos([])
    setPhotoPreviews([])
    loadAssets()
  }

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-500 text-sm mt-0.5">{assets.length} im Bestand</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Neu
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suchen…"
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`p-2 rounded-lg border text-sm flex items-center gap-1 transition-colors ${
              showFilters || typeFilter || statusFilter
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'border-gray-200 text-gray-500 bg-white'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
        {showFilters && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {typeFilters.map(f => (
                <button key={f.value} onClick={() => setTypeFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {statusFilters.map(f => (
                <button key={f.value} onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Keine Assets gefunden</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(asset => (
              <Link
                key={asset.id}
                href={`/pwa/asset/${asset.qr_code ?? asset.id}`}
                className="flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">{asset.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{assetTypeLabel(asset.type)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[asset.status]}`}>
                      {assetStatusLabel(asset.status)}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-3xl px-5 pt-5 pb-28 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Neues Asset</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Name *</label>
                <input autoFocus required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z. B. Bosch GBH 2-26" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Kategorie</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                  <option value="tool">Werkzeug</option>
                  <option value="machine">Maschine</option>
                  <option value="vehicle">Fahrzeug</option>
                </select>
              </div>
              {form.type === 'vehicle' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Kennzeichen *</label>
                  <input required={form.type === 'vehicle'} value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} placeholder="z. B. M-AB 1234" className={inputCls} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notizen</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Fotos (max. 3)</label>
                <div className="flex gap-2 flex-wrap">
                  {photoPreviews.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-xs mt-0.5">Foto</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Speichern…' : 'Asset anlegen'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

