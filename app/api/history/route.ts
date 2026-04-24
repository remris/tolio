import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'

export async function GET(req: NextRequest) {
  const session = (await getSessionUser()) ?? (await getEmployeeSession())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get('asset_id')

  let logsQuery = supabase
    .from('asset_logs')
    .select('id, asset_id, user_id, action, note, mileage, fuel_status, photo_urls, created_at, assets(name, type), users(username)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (assetId) {
    logsQuery = logsQuery.eq('asset_id', assetId)
  } else {
    // Filter to company's assets
    const { data: companyAssetIds } = await supabase
      .from('assets')
      .select('id')
      .eq('company_id', session.company_id)
    const ids = (companyAssetIds ?? []).map((a: { id: string }) => a.id)
    if (!ids.length) return NextResponse.json([])
    logsQuery = logsQuery.in('asset_id', ids)
  }

  const { data: logs, error } = await logsQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(logs ?? [])
}

