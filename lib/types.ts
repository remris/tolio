export type AssetType = 'tool' | 'machine' | 'vehicle'
export type AssetStatus = 'available' | 'in_use' | 'broken' | 'maintenance'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled'
export type CheckAction = 'check_in' | 'check_out'

export interface Company {
  id: string
  name: string
  code: string
  created_at: string
}

export interface Role {
  id: string
  company_id: string
  name: string
  created_at: string
}

export interface Permission {
  id: string
  key: string
}

export interface RolePermission {
  role_id: string
  permission_id: string
}

export interface User {
  id: string
  company_id: string
  auth_id: string | null
  username: string
  email: string | null
  role_id: string | null
  active: boolean
  created_at: string
  role?: Role
}

export interface Asset {
  id: string
  company_id: string
  name: string
  type: AssetType
  status: AssetStatus
  qr_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
  tool?: Tool
  machine?: Machine
  vehicle?: Vehicle
}

export interface Tool {
  id: string
  asset_id: string
}

export interface Machine {
  id: string
  asset_id: string
  serial_no: string | null
  manufacturer: string | null
}

export interface Vehicle {
  id: string
  asset_id: string
  license_plate: string
  mileage: number
  tuv_date: string | null
  last_maintenance_at: string | null
  next_maintenance_at: string | null
  fuel_level: number | null
  current_driver_id: string | null
}

export interface AssetLog {
  id: string
  asset_id: string
  user_id: string | null
  action: CheckAction
  note: string | null
  created_at: string
  asset?: Asset
  user?: User
}

export interface Subscription {
  id: string
  company_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: SubscriptionStatus
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export type PermissionKey =
  | 'assets.create'
  | 'assets.update'
  | 'assets.delete'
  | 'assets.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'scan.use'
  | 'vehicles.manage'
  | 'roles.manage'
  | 'maintenance.manage'

export interface SessionUser {
  id: string
  auth_id: string
  company_id: string
  username: string
  email: string | null
  role_id: string | null
  permissions: PermissionKey[]
}

