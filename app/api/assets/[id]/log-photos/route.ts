import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { getEmployeeSession } from '@/lib/auth/employee-session'

type Params = { params: Promise<{ id: string }> }

async function resolveSession() {
  return (await getSessionUser()) ?? (await getEmployeeSession())
}

// POST /api/assets/[id]/log-photos?log_id=<uuid>
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await resolveSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const logId = searchParams.get('log_id')
  if (!logId) return NextResponse.json({ error: 'log_id fehlt.' }, { status: 400 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Ungültige Formulardaten.' }, { status: 400 })

  const supabase = await createServiceClient()

  // Verify asset belongs to company
  const { data: asset } = await supabase
    .from('assets')
    .select('id')
    .eq('id', id)
    .eq('company_id', session.company_id)
    .single()
  if (!asset) return NextResponse.json({ error: 'Asset nicht gefunden.' }, { status: 404 })

  // Verify log belongs to asset and was created by this user
  const { data: log } = await supabase
    .from('asset_logs')
    .select('id, photo_urls')
    .eq('id', logId)
    .eq('asset_id', id)
    .single()
  if (!log) return NextResponse.json({ error: 'Log-Eintrag nicht gefunden.' }, { status: 404 })

  const files = formData.getAll('photos') as File[]
  if (!files.length) return NextResponse.json({ error: 'Keine Fotos übergeben.' }, { status: 400 })

  const existing: string[] = log.photo_urls ?? []
  const newUrls: string[] = []

  for (const file of files) {
    if (existing.length + newUrls.length >= 3) break
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${session.company_id}/logs/${logId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await supabase.storage
      .from('asset-photos')
      .upload(path, buffer, { contentType: file.type, upsert: false })
    if (error) continue
    const { data: urlData } = supabase.storage.from('asset-photos').getPublicUrl(path)
    newUrls.push(urlData.publicUrl)
  }

  if (!newUrls.length) return NextResponse.json({ error: 'Foto-Upload fehlgeschlagen.' }, { status: 500 })

  const updated = [...existing, ...newUrls]
  await supabase.from('asset_logs').update({ photo_urls: updated }).eq('id', logId)

  return NextResponse.json({ photo_urls: updated })
}

