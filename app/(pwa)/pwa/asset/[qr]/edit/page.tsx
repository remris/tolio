import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'
import { notFound, redirect } from 'next/navigation'
import AssetForm from '@/components/admin/AssetForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Params = { params: Promise<{ qr: string }> }

export default async function PwaAssetEditPage({ params }: Params) {
  const { qr } = await params

  const adminSession = await getSessionUser()
  const session = adminSession ?? (await getEmployeeSession())
  if (!session) redirect('/company-login')

  const permissions = session.permissions ?? []
  if (!permissions.includes('assets.update')) redirect(`/pwa/asset/${qr}`)

  const supabase = await createServiceClient()

  let { data: asset } = await supabase
    .from('assets')
    .select('*, vehicles(*), machines(*), tools(*)')
    .eq('qr_code', qr)
    .single()

  if (!asset) {
    const { data: byId } = await supabase
      .from('assets')
      .select('*, vehicles(*), machines(*), tools(*)')
      .eq('id', qr)
      .single()
    asset = byId
  }

  if (!asset) notFound()

  return (
    <div className="p-4 space-y-4 pb-24">
      <Link href={`/pwa/asset/${qr}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Link>
      <h1 className="text-xl font-bold text-gray-900">Asset bearbeiten</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <AssetForm asset={asset as any} redirectTo={`/pwa/asset/${qr}`} />
      </div>
    </div>
  )
}

