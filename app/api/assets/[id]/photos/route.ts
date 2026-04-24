import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'

type Params = { params: Promise<{ id: string }> }

async function resolveSession() {
  return (await getSessionUser()) ?? (await getEmployeeSession())
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await resolveSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const supabase = await createServiceClient()

  // Verify asset belongs to company
  const { data: asset } = await supabase
    .from('assets')
    .select('id, photo_urls')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const currentPhotos: string[] = asset.photo_urls ?? []
  if (currentPhotos.length >= 3) {
    return NextResponse.json({ error: 'Maximal 3 Fotos pro Asset.' }, { status: 400 })
  }

  const files = formData.getAll('photos') as File[]
  if (!files.length) return NextResponse.json({ error: 'Kein Foto übergeben.' }, { status: 400 })

  const newUrls: string[] = []
  for (const file of files) {
    if (currentPhotos.length + newUrls.length >= 3) break
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${session.company_id}/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await supabase.storage
      .from('asset-photos')
      .upload(path, buffer, { contentType: file.type, upsert: false })
    if (error) continue
    const { data: urlData } = supabase.storage.from('asset-photos').getPublicUrl(path)
    newUrls.push(urlData.publicUrl)
  }

  const updatedUrls = [...currentPhotos, ...newUrls]
  await supabase.from('assets').update({ photo_urls: updatedUrls }).eq('id', id)

  return NextResponse.json({ photo_urls: updatedUrls })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await resolveSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url: urlToDelete } = await req.json().catch(() => ({}))
  if (!urlToDelete) return NextResponse.json({ error: 'URL fehlt.' }, { status: 400 })

  const supabase = await createServiceClient()

  const { data: asset } = await supabase
    .from('assets')
    .select('id, photo_urls')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()

  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updatedUrls = (asset.photo_urls ?? []).filter((u: string) => u !== urlToDelete)
  await supabase.from('assets').update({ photo_urls: updatedUrls }).eq('id', id)

  return NextResponse.json({ photo_urls: updatedUrls })
}

