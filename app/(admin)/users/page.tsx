import { createClient } from '@/lib/supabase/server'
import { getAnySession } from '@/lib/auth/permissions'
import UsersTable from '@/components/admin/UsersTable'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const session = await getAnySession()
  if (!session) redirect('/login')
  if (!session.is_admin) redirect('/dashboard')
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, username, email, active, created_at, roles(name)')
    .eq('company_id', session.company_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mitarbeiter</h1>
        <Link
          href="/users/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Mitarbeiter anlegen
        </Link>
      </div>
      <UsersTable users={users ?? []} />
    </div>
  )
}
