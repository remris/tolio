'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Permission { id: string; key: string }
interface Role { id: string; name: string; role_permissions: { permission_id: string }[] }

export default function RolesManager({ roles, permissions }: { roles: Role[]; permissions: Permission[] }) {
  const router = useRouter()
  const [newRoleName, setNewRoleName] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function togglePerm(id: string) {
    setSelectedPerms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRoleName, permission_ids: selectedPerms }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler.'); setLoading(false); return }
    setNewRoleName('')
    setSelectedPerms([])
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {/* Existing roles */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b font-semibold">Vorhandene Rollen</div>
        {roles.length === 0 ? (
          <p className="p-6 text-center text-gray-400 text-sm">Keine Rollen vorhanden.</p>
        ) : (
          <ul className="divide-y">
            {roles.map((role) => (
              <li key={role.id} className="px-4 py-3">
                <p className="font-medium">{role.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {role.role_permissions
                    .map((rp) => permissions.find((p) => p.id === rp.permission_id)?.key)
                    .filter(Boolean)
                    .join(', ') || 'Keine Rechte'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create role */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Neue Rolle erstellen</h2>
        <form onSubmit={createRole} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Berechtigungen</label>
            <div className="grid grid-cols-2 gap-2">
              {permissions.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.id)}
                    onChange={() => togglePerm(perm.id)}
                    className="rounded"
                  />
                  {perm.key}
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Speichern...' : 'Rolle erstellen'}
          </button>
        </form>
      </div>
    </div>
  )
}

