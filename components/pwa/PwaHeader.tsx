'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { QrCode, Package, LogOut, Home } from 'lucide-react'

interface Session {
  username: string
  company_id: string
}

export default function PwaHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSession(data) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/employee-logout', { method: 'POST' })
    router.replace('/company-login')
  }

  const navItems = [
    { href: '/pwa/dashboard', icon: Home, label: 'Übersicht' },
    { href: '/pwa/scan', icon: QrCode, label: 'Scannen' },
  ]

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">tolio</span>
        </div>
        <div className="flex items-center gap-3">
          {session && <span className="text-xs text-gray-500 font-medium">{session.username}</span>}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 max-w-md mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

