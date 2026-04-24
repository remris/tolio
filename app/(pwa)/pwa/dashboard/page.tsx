'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ArrowRight, QrCode, Layers, Wrench, Car, AlertTriangle } from 'lucide-react'
import { assetTypeLabel } from '@/lib/utils'

interface CheckedOutAsset {
  id: string
  name: string
  type: string
  status: string
  qr_code: string | null
  checked_out_at: string
}

interface Stats {
  total: number
  available: number
  in_use: number
  broken: number
}

export default function PwaDashboardPage() {
  const [checkedOut, setCheckedOut] = useState<CheckedOutAsset[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/assets/my').then(r => r.ok ? r.json() : []),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/assets').then(r => r.ok ? r.json() : []),
    ]).then(([my, me, all]) => {
      setCheckedOut(my ?? [])
      if (me?.username) setUsername(me.username)
      if (Array.isArray(all)) {
        setStats({
          total: all.length,
          available: all.filter((a: {status:string}) => a.status === 'available').length,
          in_use: all.filter((a: {status:string}) => a.status === 'in_use').length,
          broken: all.filter((a: {status:string}) => a.status === 'broken' || a.status === 'maintenance').length,
        })
      }
    }).finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Gesamt', value: stats.total, icon: Layers, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'Verfügbar', value: stats.available, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Ausgecheckt', value: stats.in_use, icon: Wrench, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Defekt/Wartung', value: stats.broken, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ] : []

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {username ? `Hallo, ${username} 👋` : 'Übersicht'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Dein Asset-Überblick</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scan CTA */}
      <Link
        href="/pwa/scan"
        className="flex items-center justify-between bg-indigo-600 text-white rounded-xl p-4 shadow-md shadow-indigo-200 active:bg-indigo-700 transition-colors"
      >
        <div>
          <p className="font-semibold">QR-Code scannen</p>
          <p className="text-xs text-indigo-200 mt-0.5">Asset schnell aus- oder einchecken</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <QrCode className="w-5 h-5" />
        </div>
      </Link>

      {/* My checked-out assets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900 text-sm">Meine ausgecheckten Assets</p>
          <Link href="/pwa/assets" className="text-xs text-indigo-600 font-medium">Alle anzeigen</Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2].map(i => <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-gray-100" />)}
          </div>
        ) : checkedOut.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <p className="text-sm text-gray-500">Keine ausgecheckten Assets</p>
          </div>
        ) : (
          <div className="space-y-2">
            {checkedOut.map(asset => (
              <Link
                key={asset.id}
                href={`/pwa/asset/${asset.qr_code ?? asset.id}`}
                className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center justify-between active:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{asset.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-400">{assetTypeLabel(asset.type as 'tool' | 'machine' | 'vehicle')}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-yellow-600 font-medium">Ausgecheckt</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(asset.checked_out_at).toLocaleString('de-DE', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })} Uhr
                  </p>
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

