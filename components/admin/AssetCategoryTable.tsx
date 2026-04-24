'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Wrench, Cpu, Car } from 'lucide-react'
import type { Asset } from '@/lib/types'
import { assetStatusLabel, formatMileage } from '@/lib/utils'

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-yellow-100 text-yellow-700',
  broken: 'bg-red-100 text-red-700',
  maintenance: 'bg-blue-100 text-blue-700',
}

const conditionLabels: Record<string, string> = {
  good: 'Gut', worn: 'Verschlissen', damaged: 'Beschädigt',
}

// ── Tool table ────────────────────────────────────────────────
function ToolTable({ assets }: { assets: Asset[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <th className="text-left px-4 py-2 pl-10">Name</th>
          <th className="text-left px-4 py-2">Status</th>
          <th className="text-left px-4 py-2">Seriennr.</th>
          <th className="text-left px-4 py-2">Zustand</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {assets.map(a => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const t = (a as any).tools
          return (
            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 pl-10">
                <Link href={`/assets/${a.id}`} className="font-medium text-gray-900 hover:text-indigo-600 after:absolute after:inset-0">
                  {a.name}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                  {assetStatusLabel(a.status)}
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-500">{t?.serial_no ?? '–'}</td>
              <td className="px-4 py-2.5 text-gray-500">{conditionLabels[t?.condition] ?? '–'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── Machine table ─────────────────────────────────────────────
function MachineTable({ assets }: { assets: Asset[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <th className="text-left px-4 py-2 pl-10">Name</th>
          <th className="text-left px-4 py-2">Status</th>
          <th className="text-left px-4 py-2">Hersteller</th>
          <th className="text-left px-4 py-2">Seriennr.</th>
          <th className="text-left px-4 py-2">Nächste Wartung</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {assets.map(a => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = (a as any).machines
          const nextMaint = m?.next_maintenance
            ? new Date(m.next_maintenance).toLocaleDateString('de-DE')
            : '–'
          return (
            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 pl-10">
                <Link href={`/assets/${a.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                  {a.name}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                  {assetStatusLabel(a.status)}
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-500">{m?.manufacturer ?? '–'}</td>
              <td className="px-4 py-2.5 text-gray-500">{m?.serial_no ?? '–'}</td>
              <td className="px-4 py-2.5 text-gray-500">{nextMaint}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── Vehicle table ─────────────────────────────────────────────
function VehicleTable({ assets }: { assets: Asset[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <th className="text-left px-4 py-2 pl-10">Name</th>
          <th className="text-left px-4 py-2">Status</th>
          <th className="text-left px-4 py-2">Kennzeichen</th>
          <th className="text-left px-4 py-2">Kilometerstand</th>
          <th className="text-left px-4 py-2">TÜV bis</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {assets.map(a => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const v = (a as any).vehicles
          const tuv = v?.tuv_date ? new Date(v.tuv_date).toLocaleDateString('de-DE') : '–'
          return (
            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 pl-10">
                <Link href={`/assets/${a.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                  {a.name}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                  {assetStatusLabel(a.status)}
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-500">{v?.license_plate ?? '–'}</td>
              <td className="px-4 py-2.5 text-gray-500">{formatMileage(v?.mileage)}</td>
              <td className="px-4 py-2.5 text-gray-500">{tuv}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── Category section ──────────────────────────────────────────
type CategoryKey = 'tool' | 'machine' | 'vehicle'

const categoryConfig: { key: CategoryKey; label: string; icon: React.ElementType }[] = [
  { key: 'tool', label: 'Werkzeuge', icon: Wrench },
  { key: 'machine', label: 'Maschinen', icon: Cpu },
  { key: 'vehicle', label: 'Fahrzeuge', icon: Car },
]

// ── Main component ────────────────────────────────────────────
export default function AssetCategoryTable({ assets }: { assets: Asset[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ tool: true, machine: true, vehicle: true })

  function toggle(key: string) { setOpen(prev => ({ ...prev, [key]: !prev[key] })) }

  if (!assets.length) {
    return (
      <div className="bg-white border rounded-xl p-12 text-center text-gray-400 text-sm">
        Keine Assets vorhanden.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {categoryConfig.map(({ key, label, icon: Icon }) => {
        const catAssets = assets.filter(a => a.type === key)
        const isOpen = open[key]

        return (
          <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Section header */}
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
            >
              {isOpen
                ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
              <Icon className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</span>
              <span className="ml-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {catAssets.length}
              </span>
            </button>

            {/* Per-category table */}
            {isOpen && catAssets.length > 0 && (
              key === 'tool' ? <ToolTable assets={catAssets} /> :
              key === 'machine' ? <MachineTable assets={catAssets} /> :
              <VehicleTable assets={catAssets} />
            )}

            {isOpen && catAssets.length === 0 && (
              <p className="px-10 py-4 text-xs text-gray-400 italic">Keine {label} vorhanden.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
