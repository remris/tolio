'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Layers, Wrench, AlertTriangle, Activity, LogIn, QrCode, Package, XCircle, CheckCircle } from 'lucide-react'
import { assetTypeLabel } from '@/lib/utils'

interface Asset { id: string; name: string; type: string; status: string; qr_code: string | null; checked_out_at?: string }
interface Stats { total: number; available: number; in_use: number; maintenance: number; broken: number }

const typeIcon: Record<string, React.ReactNode> = {
  tool: <Wrench className="w-3.5 h-3.5" />,
  machine: <Activity className="w-3.5 h-3.5" />,
  vehicle: <Package className="w-3.5 h-3.5" />,
}

export default function PwaDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [myAssets, setMyAssets] = useState<Asset[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [returning, setReturning] = useState<string | null>(null)
  const [returnNote, setReturnNote] = useState('')
  const [returnMileage, setReturnMileage] = useState('')
  const [returnError, setReturnError] = useState('')
  const [returnDone, setReturnDone] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/assets').then(r => r.ok ? r.json() : []),
      fetch('/api/assets/my').then(r => r.ok ? r.json() : []),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ]).then(([all, mine, me]) => {
      if (me?.username) setUsername(me.username)
      if (Array.isArray(all)) {
        setStats({
          total: all.length,
          available: all.filter((a: Asset) => a.status === 'available').length,
          in_use: all.filter((a: Asset) => a.status === 'in_use').length,
          maintenance: all.filter((a: Asset) => a.status === 'maintenance').length,
          broken: all.filter((a: Asset) => a.status === 'broken').length,
        })
      }
      if (Array.isArray(mine)) setMyAssets(mine)
    }).finally(() => setLoading(false))
  }, [])

  async function handleReturn(assetId: string, assetType: string) {
    if (assetType === 'vehicle' && !returnMileage) {
      setReturnError('Kilometerstand ist beim Fahrzeug Pflicht.')
      return
    }
    setReturnError('')
    const body: Record<string, unknown> = {}
    if (returnNote) body.note = returnNote
    if (assetType === 'vehicle' && returnMileage) body.mileage = parseInt(returnMileage, 10)

    const res = await fetch(`/api/assets/${assetId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) { setReturnError(data.error ?? 'Fehler.'); return }
    setReturnDone(assetId)
    setReturning(null)
    setReturnNote('')
    setReturnMileage('')
    setMyAssets(prev => prev.filter(a => a.id !== assetId))
    setStats(prev => prev ? { ...prev, in_use: prev.in_use - 1, available: prev.available + 1 } : prev)
    setTimeout(() => setReturnDone(null), 3000)
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

  return (
    <div className="px-4 py-5 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {username ? `Hallo, ${username} 👋` : 'Dashboard'}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Deine aktuelle Übersicht</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Gesamt" value={stats.total} icon={<Layers className="w-5 h-5 text-gray-400" />} />
          <StatCard label="Verfügbar" value={stats.available} icon={<QrCode className="w-5 h-5 text-green-400" />} color="text-green-600" />
          <StatCard label="Ausgecheckt" value={stats.in_use} icon={<Wrench className="w-5 h-5 text-blue-400" />} color="text-blue-600" />
          <StatCard label="Defekt / Wartung" value={(stats.broken + stats.maintenance)} icon={<AlertTriangle className="w-5 h-5 text-amber-400" />} color="text-amber-600" />
        </div>
      )}

      {/* My checked-out assets */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-gray-900">Meine Ausleihen</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{myAssets.length}</span>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1,2].map(i => <div key={i} className="h-14 px-4 py-3 flex items-center"><div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" /></div>)}
          </div>
        ) : myAssets.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <CheckCircle className="w-8 h-8 text-green-300" />
            <p className="text-center text-gray-400 text-sm">Keine aktiven Ausleihen</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {myAssets.map(asset => (
              <div key={asset.id}>
                {returnDone === asset.id ? (
                  <div className="px-4 py-3 flex items-center gap-2 text-green-700 text-sm bg-green-50">
                    <CheckCircle className="w-4 h-4" /> Zurückgegeben
                  </div>
                ) : returning === asset.id ? (
                  <div className="px-4 py-4 space-y-3 bg-indigo-50">
                    <p className="text-sm font-semibold text-gray-800">{asset.name} zurückgeben</p>
                    {asset.type === 'vehicle' && (
                      <input
                        type="number"
                        value={returnMileage}
                        onChange={e => setReturnMileage(e.target.value)}
                        placeholder="Kilometerstand (Pflicht)"
                        className={inputCls}
                      />
                    )}
                    <input
                      type="text"
                      value={returnNote}
                      onChange={e => setReturnNote(e.target.value)}
                      placeholder="Notiz (optional)"
                      className={inputCls}
                    />
                    {returnError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <XCircle className="w-4 h-4 shrink-0" />{returnError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReturn(asset.id, asset.type)}
                        className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                      >
                        Zurückgeben
                      </button>
                      <button
                        onClick={() => { setReturning(null); setReturnError(''); setReturnNote(''); setReturnMileage('') }}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-white"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                    <Link href={`/pwa/asset/${asset.qr_code ?? asset.id}`} className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{asset.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                        {typeIcon[asset.type]}
                        <span>{assetTypeLabel(asset.type)}</span>
                        {asset.checked_out_at && (
                          <span>· seit {new Date(asset.checked_out_at).toLocaleDateString('de-DE')}</span>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={() => { setReturning(asset.id); setReturnError(''); setReturnNote(''); setReturnMileage('') }}
                      className="shrink-0 flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-green-100 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Zurückgeben
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/pwa/scan" className="bg-indigo-600 text-white rounded-2xl p-4 flex flex-col gap-2 hover:bg-indigo-700 transition-colors">
          <QrCode className="w-6 h-6" />
          <span className="font-semibold text-sm">QR scannen</span>
          <span className="text-xs text-indigo-200">Asset auschecken</span>
        </Link>
        <Link href="/pwa/assets" className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 shadow-sm hover:bg-gray-50 transition-colors">
          <Package className="w-6 h-6 text-indigo-500" />
          <span className="font-semibold text-sm text-gray-900">Inventar</span>
          <span className="text-xs text-gray-400">Alle Assets anzeigen</span>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <p className={`text-3xl font-bold ${color ?? 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

