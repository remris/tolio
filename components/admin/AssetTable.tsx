'use client'

import Link from 'next/link'
import type { Asset } from '@/lib/types'
import { assetStatusLabel, assetTypeLabel } from '@/lib/utils'

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-yellow-100 text-yellow-700',
  broken: 'bg-red-100 text-red-700',
  maintenance: 'bg-blue-100 text-blue-700',
}

export default function AssetTable({ assets }: { assets: Asset[] }) {
  if (!assets.length) {
    return (
      <div className="bg-white border rounded-xl p-12 text-center text-gray-400 text-sm">
        Keine Assets vorhanden.
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Typ</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Kennzeichen</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium">{asset.name}</td>
              <td className="px-4 py-3 text-gray-500">{assetTypeLabel(asset.type)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                  {assetStatusLabel(asset.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {asset.vehicle?.license_plate ?? '–'}
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/admin/assets/${asset.id}`} className="text-black underline">
                  Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

