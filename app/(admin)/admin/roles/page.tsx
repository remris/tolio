import { createClient } from '@/lib/supabase/server'
import { getAnySession } from '@/lib/auth/permissions'
import RolesManager from '@/components/admin/RolesManager'
import { redirect } from 'next/navigation'

export default async function RolesPage() {
  const session = await getAnySession()
  if (!session) redirect('/login')
  if (!session.is_admin) redirect('/admin/dashboard')
  const supabase = await createClient()

  const [{ data: roles }, { data: permissions }] = await Promise.all([
    supabase
      .from('roles')
      .select('id, name, role_permissions(permission_id, permissions(key))')
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
