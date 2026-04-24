import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function SettingsPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, code')
    .eq('id', session.company_id)
    .single()

  if (!company) return <p className="text-red-500">Firma nicht gefunden.</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
        <p className="text-sm text-gray-500 mt-1">Firmendaten verwalten</p>
      </div>
      <SettingsForm
        companyId={company.id}
        initialName={company.name}
        initialCode={company.code}
      />
    </div>
  )
}

