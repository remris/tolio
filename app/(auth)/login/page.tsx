'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-Mail oder Passwort falsch.')
      setLoading(false)
      return
    }
    router.refresh()
    window.location.href = '/admin/dashboard'
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">E-Mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Passwort</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Noch kein Konto?{' '}
        <a href="/register" className="underline">
          Registrieren
        </a>
      </p>
      <p className="mt-2 text-center text-sm text-gray-500">
        Mitarbeiter?{' '}
        <a href="/company-login" className="underline">
          Firmencode Login
        </a>
      </p>
    </div>
  )
}

