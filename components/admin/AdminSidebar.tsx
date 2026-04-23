'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Assets', href: '/admin/assets' },
  { label: 'Mitarbeiter', href: '/admin/users' },
  { label: 'Rollen & Rechte', href: '/admin/roles' },
  { label: 'Abonnement', href: '/admin/billing' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <aside className="w-56 bg-white border-r flex flex-col shrink-0">
      <div className="p-5 border-b">
        <span className="text-xl font-bold">tolio</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
        >
          Abmelden
        </button>
      </div>
    </aside>
  )
}

