'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Role { id: string; name: string }
interface ExistingUser { id: string; username: string; email: string | null; role_id: string | null; active: boolean }

export default function UserForm({ roles, user }: { roles: Role[]; user?: ExistingUser }) {
  const router = useRouter()
  const isEdit = !!user
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    role_id: user?.role_id ?? '',
    active: user?.active ?? true,
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload: Record<string, unknown> = {
      username: form.username,
      email: form.email || null,
      role_id: form.role_id || null,
    }
    if (isEdit) {
      payload.active = form.active
      if (form.password) payload.password = form.password
    } else {
      payload.password = form.password
    }

    const res = await fetch(isEdit ? `/api/users/${user!.id}` : '/api/users', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Fehler.'); setLoading(false); return }
    router.push('/admin/users')
    router.refresh()
  }

  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Benutzername *</label>
        <input required type="text" value={form.username} onChange={(e) => update('username', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">E-Mail</label>
        <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{isEdit ? 'Neues Passwort (leer lassen = unverändert)' : 'Passwort *'}</label>
        <input
          type="password"
          minLength={6}
          required={!isEdit}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Rolle</label>
        <select value={form.role_id} onChange={(e) => update('role_id', e.target.value)} className={inputCls}>
          <option value="">– keine –</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => update('active', e.target.checked)}
            className="rounded"
          />
          Mitarbeiter aktiv
        </label>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
        {loading ? 'Speichern...' : isEdit ? 'Speichern' : 'Mitarbeiter anlegen'}
      </button>
    </form>
  )
}
