'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface User {
  id: string
  username: string
  email: string | null
  active: boolean
  created_at: string
  roles?: { name: string } | { name: string }[] | null
}

export default function UsersTable({ users }: { users: User[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function toggleActive(user: User) {
    setLoadingId(user.id)
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })
    setLoadingId(null)
    router.refresh()
  }

  async function deleteUser(user: User) {
    if (!confirm(`Mitarbeiter "${user.username}" wirklich löschen?`)) return
    setLoadingId(user.id)
    await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    setLoadingId(null)
    router.refresh()
  }

  if (!users.length) {
    return (
      <div className="bg-white border rounded-xl p-12 text-center text-gray-400 text-sm">
        Keine Mitarbeiter vorhanden.
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Benutzername</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">E-Mail</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Rolle</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{user.username}</td>
              <td className="px-4 py-3 text-gray-500">{user.email ?? '–'}</td>
              <td className="px-4 py-3 text-gray-500">
                {Array.isArray(user.roles) ? user.roles[0]?.name ?? '–' : user.roles?.name ?? '–'}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {user.active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link href={`/admin/users/${user.id}`} className="text-black underline text-xs">
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => toggleActive(user)}
                    disabled={loadingId === user.id}
                    className="text-xs text-gray-500 hover:text-black disabled:opacity-40"
                  >
                    {user.active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                  <button
                    onClick={() => deleteUser(user)}
                    disabled={loadingId === user.id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                  >
                    Löschen
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
