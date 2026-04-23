import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import RolesManager from '@/components/admin/RolesManager'
import { redirect } from 'next/navigation'

export default async function RolesPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')
  const supabase = await createClient()

  const [{ data: roles }, { data: permissions }] = await Promise.all([
    supabase
      .from('roles')
      .select('id, name, role_permissions(permission_id)')
      .eq('company_id', session.company_id),
    supabase.from('permissions').select('id, key').order('key'),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rollen & Rechte</h1>
      <RolesManager roles={roles ?? []} permissions={permissions ?? []} />
    </div>
  )
}
