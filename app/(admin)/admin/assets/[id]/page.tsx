import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import AssetForm from '@/components/admin/AssetForm'
import AssetQrCode from '@/components/admin/AssetQrCode'
import DeleteAssetButton from '@/components/admin/DeleteAssetButton'
import type { Asset } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export default async function AssetDetailPage({ params }: Params) {
  const { id } = await params
  const session = await getSessionUser()
  const supabase = await createClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('*, vehicles(*), machines(*), tools(*)')
    .eq('id', id)
    .eq('company_id', session!.company_id)
    .single()

  if (!asset) notFound()

  const { data: logs } = await supabase
    .from('asset_logs')
    .select('id, action, created_at, users(username)')
    .eq('asset_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{asset.name}</h1>
        <DeleteAssetButton assetId={asset.id} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <AssetForm asset={asset as Asset} />
        <AssetQrCode qrCode={asset.qr_code} assetId={asset.id} />
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b font-semibold">Aktivitätslog</div>
        <ul className="divide-y">
          {logs?.map((log: any) => (
            <li key={log.id} className="px-4 py-2 flex justify-between text-sm">
              <span>
                <span className="font-medium">{log.users?.username ?? '–'}</span>
                {' – '}{log.action === 'check_out' ? 'ausgecheckt' : 'eingecheckt'}
              </span>
              <span className="text-gray-400">{new Date(log.created_at).toLocaleString('de-DE')}</span>
            </li>
          ))}
          {!logs?.length && (
            <li className="px-4 py-6 text-center text-gray-400 text-sm">Keine Einträge.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

