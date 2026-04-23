import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCompanyCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '–'
  return new Intl.DateTimeFormat('de-DE').format(new Date(date))
}

export function formatMileage(km: number | null | undefined): string {
  if (km == null) return '–'
  return new Intl.NumberFormat('de-DE').format(km) + ' km'
}

export function assetStatusLabel(status: string): string {
  const map: Record<string, string> = {
    available: 'Verfügbar',
    in_use: 'In Verwendung',
    broken: 'Defekt',
    maintenance: 'Wartung',
  }
  return map[status] ?? status
}

export function assetTypeLabel(type: string): string {
  const map: Record<string, string> = {
    tool: 'Werkzeug',
    machine: 'Maschine',
    vehicle: 'Fahrzeug',
  }
  return map[type] ?? type
}

