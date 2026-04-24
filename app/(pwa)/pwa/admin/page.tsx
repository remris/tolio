'use client'

import { useEffect, useState } from 'react'
import { UserPlus, X, CreditCard, ExternalLink } from 'lucide-react'

interface User { id: string; username: string; email: string | null; roles: { name: string } | null }
interface Role { id: string; name: string }

export default function PwaAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', role_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function loadUsers() {
    fetch('/api/users').then(r => r.ok ? r.json() : []).then(d => setUsers(d ?? []))
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.ok ? r.json() : []),
      fetch('/api/roles').then(r => r.ok ? r.json() : []),
      fetch('/api/settings').then(r => r.ok ? r.json() : null),
    ]).then(([u, r, s]) => {
      setUsers(u ?? [])
      setRoles(r ?? [])
      if (s?.name) setCompanyName(s.name)
    }).finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, email: form.email || null, password: form.password, role_id: form.role_id || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Fehler'); return }
    setShowModal(false)
    setForm({ username: '', email: '', password: '', role_id: '' })
    loadUsers()
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? '…' : `${users.length} member${users.length !== 1 ? 's' : ''}${companyName ? ` in ${companyName}` : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add employee
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</span>
        </div>
        {loading ? (
          <div className="divide-y divide-gray-100">{[1,2].map(i => <div key={i} className="h-14 px-4 py-3 flex items-center"><div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" /></div>)}</div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Keine Mitarbeiter</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(u => (
              <div key={u.id} className="grid grid-cols-2 items-center px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{u.username}</p>
                  {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
                </div>
                <span className="text-sm text-gray-600 border border-gray-200 rounded-full px-3 py-0.5 w-fit">
                  {u.roles?.name ?? '–'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Abonnement</p>
            <p className="text-xs text-gray-500">Plan verwalten</p>
          </div>
        </div>
        <a href="/billing" className="flex items-center gap-1 text-indigo-600 text-sm font-medium">
          Öffnen <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add employee</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Benutzername *</label>
                <input required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={inputCls} placeholder="max.mustermann" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">E-Mail</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="max@firma.de" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Passwort *</label>
                <input required type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputCls} placeholder="Min. 6 Zeichen" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Rolle</label>
                <select value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))} className={inputCls}>
                  <option value="">– keine –</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? 'Speichern…' : 'Add employee'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

