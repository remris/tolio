import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/permissions'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'tolio – Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('company_id', session.company_id)
    .single()

  const isBlocked =
    sub &&
    sub.status !== 'active' &&
    sub.status !== 'trialing' &&
    !(sub.current_period_end && new Date(sub.current_period_end) > new Date())

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {isBlocked ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <p className="text-2xl font-bold">Subscription abgelaufen</p>
            <p className="text-gray-500 text-sm">Dein Zugang wurde gesperrt. Bitte erneuere deine Subscription.</p>
            <a href="mailto:support@tolio.app" className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
              Support kontaktieren
            </a>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  )
}
