export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { getAnySession } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import HistoryPageClient from './HistoryPageClient'

export default async function HistoryPage() {
  const session = await getAnySession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const { data: companyAssetIds } = await supabase
    .from('assets')
    .select('id')
    .eq('company_id', session.company_id)

  const ids = (companyAssetIds ?? []).map((a: { id: string }) => a.id)

  const logs = ids.length
    ? (await supabase
        .from('asset_logs')
        .select('id, asset_id, user_id, action, note, mileage, fuel_status, photo_urls, created_at, assets(name, type), users(username)')
        .in('asset_id', ids)
        .order('created_at', { ascending: false })
        .limit(200)
      ).data ?? []
    : []

  return <HistoryPageClient logs={logs} />
}

