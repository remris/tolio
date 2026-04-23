import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import UserForm from '@/components/admin/UserForm'
import { redirect } from 'next/navigation'

export default async function NewUserPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')
  const supabase = await createClient()

  const { data: roles } = await supabase
    .from('roles')
    .select('id, name')
    .eq('company_id', session.company_id)

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Mitarbeiter anlegen</h1>
      <UserForm roles={roles ?? []} />
    </div>
  )
}
