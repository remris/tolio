'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { QrCode, Package2, LogOut, Home, Layers, ShieldCheck } from 'lucide-react'

interface SessionInfo {
  username: string
  company_id: string
  permissions: string[]
}

const ADMIN_PERMS = ['users.create', 'roles.manage', 'assets.create', 'assets.delete']

function isAdmin(permissions: string[]) {
  return permissions.some(p => ADMIN_PERMS.includes(p))
}

export default function PwaHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<SessionInfo | null>(null)

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
    { href: '/pwa/assets', icon: Layers, label: 'Assets' },
    { href: '/pwa/scan', icon: QrCode, label: 'Scannen' },
    ...(session && isAdmin(session.permissions)
      ? [{ href: '/dashboard', icon: ShieldCheck, label: 'Admin' }]
      : []),
  ]

  return (
    <>
      {/* Top bar – full width */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Package2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">tolio</span>
        </div>
        <div className="flex items-center gap-3">
          {session && <span className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{session.username}</span>}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bottom nav – full width */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 safe-area-bottom">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const isScan = href === '/pwa/scan'
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors relative ${
                active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {isScan ? (
                <div className="w-12 h-12 -mt-5 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 mb-0.5">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
              )}
              <span className={isScan ? 'text-indigo-600 font-semibold' : ''}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

