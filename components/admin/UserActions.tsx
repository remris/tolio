'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldOff, ShieldCheck, Trash2 } from 'lucide-react'

interface Props {
  userId: string
  active: boolean
}

export default function UserActions({ userId, active }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggleBlock() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Fehler.')
    }
  }

  async function handleDelete() {
    if (!confirm('Mitarbeiter wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return
    setLoading(true)
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      router.push('/users')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Fehler.')
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Aktionen</h2>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={toggleBlock}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
            active
              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
              : 'border-green-200 text-green-700 hover:bg-green-50'
          }`}
        >
          {active ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          {active ? 'Sperren' : 'Entsperren'}
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Löschen
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}

