'use client'

import { useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Wrench, Loader2, X, Gauge, Droplets } from 'lucide-react'

interface LogEntry {
  id: string
  asset_id: string
  user_id: string | null
  action: 'check_out' | 'check_in'
  note: string | null
  mileage: number | null
  fuel_status: string | null
  photo_urls: string[] | null
  created_at: string
  assets: { name: string; type: string } | null
  users: { username: string } | null
}

const actionConfig = {
  check_out: { label: 'Ausgecheckt', icon: ArrowUpFromLine, color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  check_in: { label: 'Zurückgegeben', icon: ArrowDownToLine, color: 'text-green-600 bg-green-50 border-green-200', dot: 'bg-green-400' },
}

const fuelLabels: Record<string, string> = {
  full: 'Voll 💚', three_quarter: '¾ 🟡', half: '½ 🟡', quarter: '¼ 🔴', empty: 'Leer 🔴',
}

const typeLabel: Record<string, string> = {
  tool: 'Werkzeug', machine: 'Maschine', vehicle: 'Fahrzeug',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function PwaHistoryPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<LogEntry | null>(null)

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.ok ? r.json() : [])
      .then(d => setLogs(d ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="px-4 pt-5 pb-4 bg-gray-50 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Historie</h1>
        <p className="text-gray-500 text-sm mt-0.5">Alle Aktivitäten – tippe für Details</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Wrench className="w-8 h-8 text-gray-300" />
          <p className="text-center text-gray-400 text-sm">Noch keine Aktivitäten</p>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-2">
          {logs.map(log => {
            const cfg = actionConfig[log.action] ?? actionConfig.check_out
            const Icon = cfg.icon
            const isDefect = log.note?.startsWith('[DEFEKT]')
            return (
              <button
                key={log.id}
                onClick={() => setSelected(log)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${isDefect ? 'text-red-600 bg-red-50 border-red-200' : cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {log.assets?.name ?? 'Unbekanntes Asset'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">
                        {isDefect ? '🔴 Defekt gemeldet' : cfg.label} · {log.users?.username ?? '–'}
                      </span>
                      {log.mileage != null && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Gauge className="w-3 h-3" /> {log.mileage.toLocaleString('de-DE')} km
                        </span>
                      )}
                      {log.fuel_status && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Droplets className="w-3 h-3" /> {fuelLabels[log.fuel_status] ?? log.fuel_status}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {formatDateShort(log.created_at)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail popup */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-3xl px-5 pt-5 pb-10 w-full max-w-lg shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {typeLabel[selected.assets?.type ?? ''] ?? 'Asset'}
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">{selected.assets?.name ?? '–'}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <Row label="Aktion" value={selected.note?.startsWith('[DEFEKT]') ? '🔴 Defekt gemeldet' : actionConfig[selected.action]?.label ?? selected.action} />
              <Row label="Mitarbeiter" value={selected.users?.username ?? '–'} />
              <Row label="Zeitpunkt" value={formatDate(selected.created_at)} />

              {selected.mileage != null && (
                <Row label="Kilometerstand" value={`${selected.mileage.toLocaleString('de-DE')} km`} />
              )}

              {selected.fuel_status && (
                <Row label="Tankstatus" value={fuelLabels[selected.fuel_status] ?? selected.fuel_status} />
              )}

              {selected.note && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notiz</p>
                  <p className="text-sm text-gray-700">
                    {selected.note.startsWith('[DEFEKT] ')
                      ? selected.note.replace('[DEFEKT] ', '')
                      : selected.note}
                  </p>
                </div>
              )}

              {selected.photo_urls && selected.photo_urls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fotos</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 block shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

