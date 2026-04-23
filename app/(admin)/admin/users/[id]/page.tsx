import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import UserForm from '@/components/admin/UserForm'

type Params = { params: Promise<{ id: string }> }

export default async function EditUserPage({ params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  const supabase = await createClient()

  const [{ data: user }, { data: roles }] = await Promise.all([
    supabase
      .from('users')
      .select('id, username, email, role_id, active')
      .eq('id', id)
      .eq('company_id', session!.company_id)
      .single(),
    supabase
      .from('roles')
      .select('id, name')
      .eq('company_id', session!.company_id),
  ])

  if (!user) notFound()

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Mitarbeiter bearbeiten</h1>
      <UserForm roles={roles ?? []} user={user} />
    </div>
  )
}
