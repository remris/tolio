export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getAnySession } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import AssetForm from '@/components/admin/AssetForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Asset } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export default async function AssetEditPage({ params }: Params) {
  const { id } = await params
  const session = await getAnySession()
  if (!session) notFound()

  const supabase = await createClient()
  const { data: asset } = await supabase
    .from('assets')
    .select('*, vehicles(*), machines(*), tools(*)')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) notFound()

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/assets/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Zurück
        </Link>
        <h1 className="text-2xl font-bold">{asset.name} bearbeiten</h1>
      </div>
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <AssetForm asset={asset as Asset} redirectTo={`/admin/assets/${id}`} />
      </div>
    </div>
  )
}

