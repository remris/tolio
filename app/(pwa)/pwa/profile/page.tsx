'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, Building2, Key } from 'lucide-react'

interface Me { id: string; username: string; permissions: string[] }

export default function PwaProfilePage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [company, setCompany] = useState<{ name: string; code: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/settings').then(r => r.ok ? r.json() : null),
    ]).then(([m, s]) => {
      setMe(m)
      if (s) setCompany({ name: s.name, code: s.code })
    }).finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/employee-logout', { method: 'POST' })
    router.replace('/company-login')
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="text-3xl font-bold text-gray-900">Profil</h1>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{loading ? '…' : (me?.username ?? '–')}</p>
            <p className="text-sm text-gray-500">{me?.permissions?.length ? 'Admin' : 'Mitarbeiter'}</p>
          </div>
        </div>
        {company && (
          <>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Firma</p>
                <p className="text-sm font-medium text-gray-800">{company.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Key className="w-4 h-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Firmencode</p>
                <p className="text-sm font-mono font-semibold text-indigo-600">{company.code}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-3.5 rounded-2xl font-semibold text-sm hover:bg-red-50 transition-colors shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        Abmelden
      </button>
    </div>
  )
}

