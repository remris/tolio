import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
const schema = z.object({
  company_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})
function generateCompanyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungueltige Eingabe.' }, { status: 400 })
  }
  const { company_name, email, password } = parsed.data
  const serviceClient = await createServiceClient()
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Auth-Fehler.' }, { status: 400 })
  }
  let code = generateCompanyCode()
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await serviceClient.from('companies').select('id').eq('code', code).single()
    if (!existing) break
    code = generateCompanyCode()
  }
  const { data: company, error: companyError } = await serviceClient
    .from('companies')
    .insert({ name: company_name, code })
    .select('id')
    .single()
  if (companyError || !company) {
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Firma konnte nicht erstellt werden.' }, { status: 500 })
  }
  const { data: permissions } = await serviceClient.from('permissions').select('id')
  const { data: adminRole, error: roleError } = await serviceClient
    .from('roles')
    .insert({ company_id: company.id, name: 'Admin' })
    .select('id')
    .single()
  if (!roleError && adminRole && permissions) {
    await serviceClient.from('role_permissions').insert(
      permissions.map((p: { id: string }) => ({ role_id: adminRole.id, permission_id: p.id })),
    )
  }
  const { error: userError } = await serviceClient.from('users').insert({
    company_id: company.id,
    auth_id: authData.user.id,
    username: email.split('@')[0],
    email,
    role_id: adminRole?.id ?? null,
    active: true,
  })
  if (userError) {
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    await serviceClient.from('companies').delete().eq('id', company.id)
    return NextResponse.json({ error: 'Benutzer konnte nicht erstellt werden.' }, { status: 500 })
  }
  await serviceClient.from('subscriptions').insert({
    company_id: company.id,
    status: 'trialing',
  })
  const anonClient = await createClient()
  await anonClient.auth.signInWithPassword({ email, password })
  return NextResponse.json({ ok: true }, { status: 201 })
}
