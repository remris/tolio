'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AssetStatus } from '@/lib/types'

interface Props {
  assetId: string
  status: AssetStatus
}

export default function CheckActions({ assetId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(action: 'checkin' | 'checkout') {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/assets/${assetId}/${action}`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler.'); setLoading(false); return }
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      {status === 'available' && (
        <button
          onClick={() => handle('checkout')}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl text-base font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? '...' : '📤 Auschecken'}
        </button>
      )}
      {status === 'in_use' && (
        <button
          onClick={() => handle('checkin')}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '...' : '📥 Einchecken'}
        </button>
      )}
      {status !== 'available' && status !== 'in_use' && (
        <p className="text-center text-sm text-gray-500">Kein Check-in/out möglich ({status}).</p>
      )}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  )
}

