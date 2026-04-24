'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CompanyLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ code: '', username: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/auth/company-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Anmeldung fehlgeschlagen.')
      setLoading(false)
      return
    }
    router.replace('/pwa/scan')
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Mitarbeiter Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(['code', 'username', 'password'] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-1 capitalize">
              {field === 'code' ? 'Firmencode' : field === 'username' ? 'Benutzername' : 'Passwort'}
            </label>
            <input
              type={field === 'password' ? 'password' : 'text'}
              required
              value={form[field]}
              onChange={(e) => update(field, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Admin?{' '}
        <a href="/login" className="underline">
          Admin Login
        </a>
      </p>
    </div>
  )
}

