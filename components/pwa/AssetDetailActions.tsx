'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Wrench, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  assetId: string
  canEdit: boolean
  canMaintain: boolean
  canDelete: boolean
}

export default function AssetDetailActions({ assetId, canEdit, canMaintain, canDelete }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [maintaining, setMaintaining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMaintain() {
    setMaintaining(true)
    setError(null)
    const res = await fetch(`/api/assets/${assetId}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performed_at: new Date().toISOString().slice(0, 10) }),
    })
    setMaintaining(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Fehler.')
    } else {
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm('Asset wirklich löschen?')) return
    setDeleting(true)
    const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      router.replace('/pwa/assets')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Fehler.')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
      <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Aktionen</p>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Link
            href={`/admin/assets/${assetId}/edit`}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-medium"
          >
            <Pencil className="w-4 h-4" /> Bearbeiten
          </Link>
        )}
        {canMaintain && (
          <button
            onClick={handleMaintain}
            disabled={maintaining}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            <Wrench className="w-4 h-4" /> {maintaining ? '…' : 'Wartung markieren'}
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-xl px-4 py-2.5 hover:bg-red-50 font-medium disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? '…' : 'Löschen'}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}

