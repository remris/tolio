'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Layers, Wrench, AlertTriangle, Activity, QrCode } from 'lucide-react'
import { assetStatusLabel } from '@/lib/utils'

interface Asset { id: string; name: string; status: string; qr_code: string | null }
interface Stats { total: number; in_use: number; maintenance: number; broken: number }

const statusBadge: Record<string, string> = {
  available: 'bg-green-100 text-green-700 border border-green-200',
  in_use: 'bg-blue-100 text-blue-700 border border-blue-200',
  broken: 'bg-red-100 text-red-600 border border-red-200',
  maintenance: 'bg-amber-100 text-amber-700 border border-amber-200',
}
const statusDot: Record<string, string> = {
  available: 'bg-green-500', in_use: 'bg-blue-500', broken: 'bg-red-500', maintenance: 'bg-amber-500',
}

export default function PwaDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Asset[]>([])
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/assets').then(r => r.ok ? r.json() : []),
      fetch('/api/settings').then(r => r.ok ? r.json() : null),
    ]).then(([assets, company]) => {
      if (company?.name) setCompanyName(company.name)
      if (Array.isArray(assets)) {
        setStats({
          total: assets.length,
          in_use: assets.filter((a: Asset) => a.status === 'in_use').length,
          maintenance: assets.filter((a: Asset) => a.status === 'maintenance').length,
          broken: assets.filter((a: Asset) => a.status === 'broken').length,
        })
        setRecent(assets.slice(0, 5))
      }
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-4 py-5 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">{companyName ? `${companyName} · ` : ''}overview of your fleet.</p>
      </div>

      <Link href="/pwa/tools" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
        Manage tools <ArrowRight className="w-4 h-4" />
      </Link>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total tools" value={stats.total} icon={<Layers className="w-5 h-5 text-gray-400" />} />
          <StatCard label="Active checkouts" value={stats.in_use} icon={<Wrench className="w-5 h-5 text-blue-400" />} />
          <StatCard label="Maintenance due" value={stats.maintenance} icon={<AlertTriangle className="w-5 h-5 text-amber-400" />} />
          <StatCard label="Broken" value={stats.broken} icon={<Activity className="w-5 h-5 text-red-400" />} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-gray-900">Recent tools</span>
          <Link href="/pwa/tools" className="text-sm text-gray-500 hover:text-gray-700">View all</Link>
        </div>
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1,2,3].map(i => <div key={i} className="h-12 px-4 py-2 flex items-center"><div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" /></div>)}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <QrCode className="w-8 h-8 text-gray-300" />
            <p className="text-center text-gray-400 text-sm">Noch keine Assets</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent.map(asset => (
              <Link
                key={asset.id}
                href={`/pwa/asset/${asset.qr_code ?? asset.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100"
              >
                <span className="text-sm text-gray-800 font-medium">{asset.name}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[asset.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[asset.status] ?? 'bg-gray-400'}`} />
                  {assetStatusLabel(asset.status)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

