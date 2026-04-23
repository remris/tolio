'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteAssetButton({ assetId }: { assetId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Asset wirklich löschen? Alle Logs werden ebenfalls gelöscht.')) return
    setLoading(true)
    const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/assets')
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error ?? 'Fehler beim Löschen.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-500 hover:text-red-700 underline disabled:opacity-40"
    >
      {loading ? 'Löschen...' : 'Asset löschen'}
    </button>
  )
}

