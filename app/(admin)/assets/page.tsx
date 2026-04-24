import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import AssetCategoryTable from '@/components/admin/AssetCategoryTable'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AssetsPage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')
  const supabase = await createClient()

  const { data: assets } = await supabase
    .from('assets')
    .select('*, vehicles(*), machines(*), tools(*)')
    .eq('company_id', session.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventar</h1>
        <Link
          href="/assets/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Gegenstand anlegen
        </Link>
      </div>

      <AssetCategoryTable assets={assets ?? []} />
    </div>
  )
}

