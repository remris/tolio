import { createClient } from '@/lib/supabase/server'
import { getEmployeeSession } from '@/lib/auth/employee-session'
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
    rolePerms?.flatMap((rp) => {
      const perm = rp.permissions as { key: string } | null | { key: string }[]
      if (!perm) return []
      if (Array.isArray(perm)) return perm.map(p => p.key as PermissionKey)
      return [perm.key as PermissionKey]
    }) ?? []

  return {
    id: user.id,
    auth_id: authUser.id,
    company_id: user.company_id,
    username: user.username,
    email: user.email,
    role_id: user.role_id,
    permissions,
    is_admin: true,
  }
}

/** Returns admin session first, falls back to employee session */
export async function getAnySession(): Promise<SessionUser | null> {
  return (await getSessionUser()) ?? (await getEmployeeSession())
}

export function hasPermission(user: SessionUser, permission: PermissionKey): boolean {
  return user.permissions.includes(permission)
}

export function requirePermission(user: SessionUser, permission: PermissionKey): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Missing permission: ${permission}`)
  }
}

