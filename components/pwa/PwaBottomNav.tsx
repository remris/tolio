'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, ScanLine, History, ShieldCheck, UserCircle } from 'lucide-react'

interface SessionInfo {
  id: string
  username: string
  company_id: string
  permissions: string[]
}

const ADMIN_PERMS = ['users.create', 'roles.manage', 'assets.create', 'assets.delete']
const isAdmin = (p: string[]) => p.some(x => ADMIN_PERMS.includes(x))

export default function PwaBottomNav() {
  const pathname = usePathname()
  const [session, setSession] = useState<SessionInfo | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSession(d) })
      .catch(() => {})
  }, [])

  const adminMode = session ? isAdmin(session.permissions) : false

  const items = [
    { href: '/pwa/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pwa/assets', icon: Package, label: 'Inventar' },
    { href: '/pwa/scan', icon: ScanLine, label: 'Scannen' },
    { href: '/pwa/history', icon: History, label: 'Historie' },
    adminMode
      ? { href: '/pwa/admin', icon: ShieldCheck, label: 'Admin' }
      : { href: '/pwa/profile', icon: UserCircle, label: 'Profil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (pathname.startsWith(href + '/') && href !== '/pwa/dashboard') || (pathname === '/pwa/dashboard' && href === '/pwa/dashboard')
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              active ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} strokeWidth={active ? 2.5 : 1.5} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
