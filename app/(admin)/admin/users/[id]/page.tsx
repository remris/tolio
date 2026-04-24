import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { notFound, redirect } from 'next/navigation'
import UserForm from '@/components/admin/UserForm'
import UserActions from '@/components/admin/UserActions'

type Params = { params: Promise<{ id: string }> }

export default async function EditUserPage({ params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) redirect('/login')
  const supabase = await createServiceClient()
  const [{ data: user }, { data: roles }, { data: recentLogs }] = await Promise.all([
    supabase
      .from('users')
      .select('id, username, email, role_id, active')
      .eq('id', id)
      .eq('company_id', session.company_id)
      .single(),
    supabase
      .from('roles')
      .select('id, name')
      .eq('company_id', session.company_id),
    supabase
      .from('asset_logs')
      .select('id, action, note, created_at, assets(name)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])
  if (!user) notFound()
  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">Mitarbeiter bearbeiten</h1>
        <UserForm roles={roles ?? []} user={user} />
      </div>

      <UserActions userId={id} active={user.active} />

      {recentLogs && recentLogs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Letzte Aktivitäten</h2>
          <div className="space-y-2">
            {recentLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2.5">
                <div>
                  <span className={`font-medium ${log.action === 'check_out' ? 'text-amber-700' : 'text-green-700'}`}>
                    {log.action === 'check_out' ? 'Ausgecheckt' : 'Zurückgegeben'}
                  </span>
                  <span className="text-gray-500"> – {(log.assets as any)?.name ?? '–'}</span>
                </div>
                <span className="text-gray-400 text-xs">
                  {new Date(log.created_at).toLocaleDateString('de-DE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

