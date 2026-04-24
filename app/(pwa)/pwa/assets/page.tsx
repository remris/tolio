'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Filter, ArrowRight, Loader2 } from 'lucide-react'
import { assetTypeLabel, assetStatusLabel } from '@/lib/utils'

interface Asset {
  id: string
  name: string
  type: 'tool' | 'machine' | 'vehicle'
  status: 'available' | 'in_use' | 'broken' | 'maintenance'
  qr_code: string | null
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

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/assets?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled) setAssets(data ?? []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [typeFilter, statusFilter])

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-100 sticky top-[57px] z-40">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Assets</h1>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suchen…"
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`p-2 rounded-lg border text-sm flex items-center gap-1 transition-colors ${
              showFilters || typeFilter || statusFilter
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'border-gray-200 text-gray-500 bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {typeFilters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    typeFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {statusFilters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
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
          <div className="text-center py-16 text-gray-400 text-sm">
            Keine Assets gefunden
          </div>
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
    </div>
  )
}

