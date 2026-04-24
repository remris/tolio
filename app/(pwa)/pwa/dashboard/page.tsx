'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ArrowRight, QrCode } from 'lucide-react'
import { assetTypeLabel } from '@/lib/utils'

interface CheckedOutAsset {
  id: string
  name: string
  type: string
  status: string
  qr_code: string | null
  checked_out_at: string
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-yellow-100 text-yellow-700',
  broken: 'bg-red-100 text-red-700',
  maintenance: 'bg-blue-100 text-blue-700',
}

export default function PwaDashboardPage() {
  const [assets, setAssets] = useState<CheckedOutAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/assets/my').then(r => r.ok ? r.json() : []),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
    ]).then(([myAssets, me]) => {
      setAssets(myAssets ?? [])
      if (me?.username) setUsername(me.username)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Hallo{username ? `, ${username}` : ''} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Deine ausgecheckten Assets</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Keine ausgecheckten Assets</p>
          <p className="text-gray-400 text-xs mt-1">Scanne einen QR-Code um ein Asset auszuchecken</p>
          <Link
            href="/pwa/scan"
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Jetzt scannen
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map(asset => (
            <Link
              key={asset.id}
              href={`/pwa/asset/${asset.qr_code ?? asset.id}`}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between hover:border-indigo-200 transition-colors block"
            >
              <div className="space-y-1">
                <p className="font-semibold text-gray-900 text-sm">{asset.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{assetTypeLabel(asset.type as 'tool' | 'machine' | 'vehicle')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[asset.status]}`}>
                    Ausgecheckt
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  seit {new Date(asset.checked_out_at).toLocaleDateString('de-DE', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })} Uhr
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-900">Asset einchecken</p>
          <p className="text-xs text-indigo-600 mt-0.5">QR-Code des Assets scannen</p>
        </div>
        <Link
          href="/pwa/scan"
          className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
        >
          <QrCode className="w-4 h-4" />
          Scannen
        </Link>
      </div>
    </div>
  )
}

