import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import AssetTable from '@/components/admin/AssetTable'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const session = await getSessionUser()
  if (!session) redirect('/login')
  const supabase = await createClient()

  let query = supabase
    .from('assets')
    .select('*, vehicles(*), machines(*), tools(*)')
    .eq('company_id', session.company_id)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data: assets } = await query

  const tabs = [
    { label: 'Alle', value: '' },
    { label: 'Werkzeuge', value: 'tool' },
    { label: 'Maschinen', value: 'machine' },
    { label: 'Fahrzeuge', value: 'vehicle' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Link
          href="/admin/assets/new"
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          + Asset anlegen
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/assets?type=${tab.value}` : '/admin/assets'}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              (type ?? '') === tab.value
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <AssetTable assets={assets ?? []} />
    </div>
  )
}

