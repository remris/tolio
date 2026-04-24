'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: form.company_name,
        email: form.email,
        password: form.password,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Registrierung fehlgeschlagen.')
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-2 text-center">Konto erstellen</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Starte deinen Betrieb mit Tolio</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Firmenname">
          <input
            type="text"
            required
            value={form.company_name}
            onChange={(e) => update('company_name', e.target.value)}
            className={inputCls}
            placeholder="z. B. Mustermann GmbH"
          />
        </Field>
        <Field label="E-Mail">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Passwort">
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Passwort bestätigen">
          <input
            type="password"
            required
            minLength={6}
            value={form.confirm_password}
            onChange={(e) => update('confirm_password', e.target.value)}
            className={inputCls}
          />
        </Field>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Registrieren...' : 'Jetzt starten'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Bereits registriert?{' '}
        <a href="/login" className="underline">
          Anmelden
        </a>
      </p>
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  )
}

