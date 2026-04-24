'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Wrench,
  Users,
  ShieldCheck,
  CreditCard,
  LogOut,
  Package2,
  Settings,
} from 'lucide-react'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
  { label: 'Assets', href: '/assets', icon: Wrench, adminOnly: false },
  { label: 'Mitarbeiter', href: '/users', icon: Users, adminOnly: true },
  { label: 'Rollen & Rechte', href: '/roles', icon: ShieldCheck, adminOnly: true },
  { label: 'Abonnement', href: '/billing', icon: CreditCard, adminOnly: true },
  { label: 'Einstellungen', href: '/settings', icon: Settings, adminOnly: true },
]

interface Props {
  username: string
  companyName: string
  isAdmin?: boolean
}

export default function AdminSidebar({ username, companyName, isAdmin = true }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // also clear employee session cookie
    await fetch('/api/auth/employee-logout', { method: 'POST' })
    router.replace('/login')
  }

  const visibleNav = nav.filter(item => !item.adminOnly || isAdmin)

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Package2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold text-gray-900 tracking-tight">tolio</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {visibleNav.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
          <p className="text-xs text-gray-400 truncate">{companyName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          Abmelden
        </button>
      </div>
    </aside>
  )
}
