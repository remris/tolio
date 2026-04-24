n'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Wrench, Cpu, Car } from 'lucide-react'
import type { Asset } from '@/lib/types'
import { assetStatusLabel } from '@/lib/utils'

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-yellow-100 text-yellow-700',
  broken: 'bg-red-100 text-red-700',
  maintenance: 'bg-blue-100 text-blue-700',
}

const categoryConfig = [
  { key: 'tool', label: 'Werkzeuge', icon: Wrench },
  { key: 'machine', label: 'Maschinen', icon: Cpu },
  { key: 'vehicle', label: 'Fahrzeuge', icon: Car },
] as const

interface Props {
  assets: Asset[]
}

export default function AssetCategoryTable({ assets }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState<Record<string, boolean>>({
    tool: true,
    machine: true,
    vehicle: true,
  })

  function toggle(key: string) {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!assets.length) {
    return (
      <div className="bg-white border rounded-xl p-12 text-center text-gray-400 text-sm">
        Keine Assets vorhanden.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_160px_160px_160px] border-b bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <span>Bezeichnung</span>
        <span>Status</span>
        <span>Kennzeichen</span>
        <span />
      </div>

      {categoryConfig.map(({ key, label, icon: Icon }, catIdx) => {
        const catAssets = assets.filter(a => a.type === key)
        const isOpen = open[key]

        return (
          <div key={key} className={catIdx > 0 ? 'border-t border-gray-100' : ''}>
            {/* Category header */}
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <Icon className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
              <span className="ml-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {catAssets.length}
              </span>
            </button>

            {/* Category rows */}
            {isOpen && catAssets.length > 0 && (
              <div className="divide-y divide-gray-50">
                {catAssets.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => router.push(`/admin/assets/${asset.id}`)}
                    className="grid grid-cols-[1fr_160px_160px_160px] items-center px-4 py-3 pl-10 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-gray-900 text-sm">{asset.name}</span>
                    <span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                        {assetStatusLabel(asset.status)}
                      </span>
                    </span>
                    <span className="text-sm text-gray-500">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {asset.type === 'vehicle' ? ((asset as any).vehicles?.license_plate ?? '–') : '–'}
                    </span>
                    <span />
                  </div>
                ))}
              </div>
            )}

            {isOpen && catAssets.length === 0 && (
              <p className="pl-10 pb-3 text-xs text-gray-400 italic">Keine {label} vorhanden.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

