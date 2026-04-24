import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'

export async function GET() {
  const session = (await getSessionUser()) ?? (await getEmployeeSession())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()

  // Get all assets currently checked out by this user (last log = check_out)
  const { data: logs } = await supabase
    .from('asset_logs')
    .select('asset_id, action, created_at, assets(id, name, type, status, qr_code)')
    .eq('user_id', session.id)
    .order('created_at', { ascending: false })

  if (!logs) return NextResponse.json([])

  // Find assets where the latest log action = check_out
  const seen = new Set<string>()
  const checkedOut: unknown[] = []
  for (const log of logs) {
    if (seen.has(log.asset_id)) continue
    seen.add(log.asset_id)
    if (log.action === 'check_out' && log.assets) {
      checkedOut.push({ ...log.assets, checked_out_at: log.created_at })
    }
  }

  return NextResponse.json(checkedOut)
}

