'use client'

import { useRouter } from 'next/navigation'
import type { Asset } from '@/lib/types'
import { assetStatusLabel, assetTypeLabel } from '@/lib/utils'

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-yellow-100 text-yellow-700',
  broken: 'bg-red-100 text-red-700',
  maintenance: 'bg-blue-100 text-blue-700',
}

export default function AssetTable({ assets }: { assets: Asset[] }) {
  const router = useRouter()

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
          </tr>
        </thead>
        <tbody className="divide-y">
          {assets.map((asset) => (
            <tr
              key={asset.id}
              onClick={() => router.push(`/admin/assets/${asset.id}`)}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <td className="px-4 py-3 font-medium">{asset.name}</td>
              <td className="px-4 py-3 text-gray-500">{assetTypeLabel(asset.type)}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                  {assetStatusLabel(asset.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {asset.type === 'vehicle' ? ((asset as any).vehicles?.license_plate ?? '–') : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
