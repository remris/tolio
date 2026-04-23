import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
export async function GET(req: NextRequest) {
  const session = await getSessionUser()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const supabase = await createClient()
  let csv = ''
  if (type === 'logs') {
    const { data } = await supabase
      .from('asset_logs')
      .select('id, action, mileage, note, created_at, assets(name, type, company_id), users(username)')
      .order('created_at', { ascending: false })
    const rows = (data ?? []).filter((l: any) => l.assets?.company_id === session.company_id)
    csv = 'ID,Aktion,Asset,Typ,Mitarbeiter,KM,Notiz,Datum\n'
    csv += rows.map((l: any) => [
      l.id,
      l.action,
      '"' + (l.assets?.name ?? '').replace(/"/g, '""') + '"',
      l.assets?.type ?? '',
      '"' + (l.users?.username ?? '') + '"',
      l.mileage ?? '',
      '"' + (l.note ?? '').replace(/"/g, '""') + '"',
      new Date(l.created_at).toLocaleString('de-DE'),
    ].join(',')).join('\n')
  } else if (type === 'maintenance') {
    const { data } = await supabase
      .from('maintenance_records')
      .select('id, performed_at, description, cost, next_due_at, created_at, assets(name, company_id), users(username)')
      .order('performed_at', { ascending: false })
    const rows = (data ?? []).filter((r: any) => r.assets?.company_id === session.company_id)
    csv = 'ID,Asset,Durchgefuehrt,Beschreibung,Kosten,Naechste Faelligkeit,Mitarbeiter,Erstellt\n'
    csv += rows.map((r: any) => [
      r.id,
      '"' + (r.assets?.name ?? '').replace(/"/g, '""') + '"',
      r.performed_at,
      '"' + (r.description ?? '').replace(/"/g, '""') + '"',
      r.cost ?? '',
      r.next_due_at ?? '',
      '"' + (r.users?.username ?? '') + '"',
      new Date(r.created_at).toLocaleString('de-DE'),
    ].join(',')).join('\n')
  } else {
    const { data } = await supabase
      .from('assets')
      .select('id, name, type, status, qr_code, created_at, vehicles(license_plate, mileage, tuv_date), machines(manufacturer, serial_no)')
      .eq('company_id', session.company_id)
      .order('created_at', { ascending: false })
    csv = 'ID,Name,Typ,Status,QR-Code,Kennzeichen,KM,TUeV,Hersteller,Seriennr.,Erstellt\n'
    csv += (data ?? []).map((a: any) => [
      a.id,
      '"' + a.name.replace(/"/g, '""') + '"',
      a.type,
      a.status,
      a.qr_code ?? '',
      a.vehicles?.license_plate ?? '',
      a.vehicles?.mileage ?? '',
      a.vehicles?.tuv_date ?? '',
      '"' + (a.machines?.manufacturer ?? '') + '"',
      '"' + (a.machines?.serial_no ?? '') + '"',
      new Date(a.created_at).toLocaleString('de-DE'),
    ].join(',')).join('\n')
  }
  const filename = `tolio-export-${type ?? 'assets'}-${new Date().toISOString().slice(0, 10)}.csv`
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}