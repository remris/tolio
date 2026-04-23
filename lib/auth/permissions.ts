import { createClient } from '@/lib/supabase/server'
import type { PermissionKey, SessionUser } from '@/lib/types'

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient()

  const { data: { user: authUser }, error } = await supabase.auth.getUser()
  if (error || !authUser) return null

  const { data: user } = await supabase
    .from('users')
    .select('id, company_id, username, email, role_id, auth_id')
    .eq('auth_id', authUser.id)
    .eq('active', true)
    .single()

  if (!user) return null

  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('permissions(key)')
    .eq('role_id', user.role_id ?? '')

  const permissions: PermissionKey[] =
    rolePerms?.flatMap((rp: any) =>
      rp.permissions ? [rp.permissions.key as PermissionKey] : [],
    ) ?? []

  return {
    id: user.id,
    auth_id: authUser.id,
    company_id: user.company_id,
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    permissions,
  }
}

export function hasPermission(user: SessionUser, permission: PermissionKey): boolean {
  return user.permissions.includes(permission)
}

export function requirePermission(user: SessionUser, permission: PermissionKey): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Missing permission: ${permission}`)
  }
}

