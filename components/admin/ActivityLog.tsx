'use client'

import { useState } from 'react'
import { X, Camera } from 'lucide-react'

const actionLabel: Record<string, string> = {
  check_out: 'Ausgecheckt',
  check_in: 'Zurückgegeben',
  broken: 'Defekt gemeldet',
  maintenance: 'Wartung',
}

const actionDot: Record<string, string> = {
  check_out: 'bg-amber-400',
  check_in: 'bg-green-400',
  broken: 'bg-red-500',
  maintenance: 'bg-blue-400',
}

const fuelLabels: Record<string, string> = {
  full: 'Voll',
  three_quarter: '¾',
  half: '½',
  quarter: '¼',
  empty: 'Leer',
}

export interface LogEntry {
  id: string
  action: string
  note?: string | null
  created_at: string
  mileage?: number | null
  fuel_status?: string | null
  photo_urls?: string[] | null
  users?: { username: string } | { username: string }[] | null
}

function getUsername(users: LogEntry['users']): string {
  if (!users) return '–'
  if (Array.isArray(users)) return users[0]?.username ?? '–'
  return users.username ?? '–'
}

function DetailModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-base">
            {actionLabel[log.action] ?? log.action}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 text-sm">
          <Row label="Von" value={getUsername(log.users)} />
          <Row
            label="Datum"
            value={new Date(log.created_at).toLocaleString('de-DE', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          />
          {log.mileage != null && (
            <Row label="Kilometerstand" value={`${log.mileage.toLocaleString('de-DE')} km`} />
          )}
          {log.fuel_status && (
            <Row label="Tankstatus" value={fuelLabels[log.fuel_status] ?? log.fuel_status} />
          )}
          {log.note && (
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Notiz</p>
              <p className="text-gray-800 italic">&bdquo;{log.note}&ldquo;</p>
            </div>
          )}
          {log.photo_urls && log.photo_urls.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Fotos ({log.photo_urls.length})
              </p>
              <div className="flex gap-2 flex-wrap">
                {log.photo_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 block shrink-0 bg-gray-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="text-gray-400 text-xs w-28 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-sm">{value}</span>
    </div>
  )
}

interface Props {
  history: LogEntry[]
}

export default function ActivityLog({ history }: Props) {
  const [selected, setSelected] = useState<LogEntry | null>(null)

  if (!history || history.length === 0) {
    return <p className="text-sm text-gray-400">Noch keine Aktivitäten.</p>
  }

  return (
    <>
      {selected && <DetailModal log={selected} onClose={() => setSelected(null)} />}

      <div className="divide-y divide-gray-50">
        {history.map(log => {
          const photoCount = log.photo_urls?.length ?? 0
          return (
            <button
              key={log.id}
              onClick={() => setSelected(log)}
              className="w-full text-left flex items-center gap-3 py-3 px-1 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              {/* Dot */}
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${actionDot[log.action] ?? 'bg-gray-400'}`} />

              {/* Label + user */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">
                    {actionLabel[log.action] ?? log.action}
                  </span>
                  {photoCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                      <Camera className="w-3 h-3" />
                      {photoCount > 1 ? `${photoCount} Fotos` : '1 Foto'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">von {getUsername(log.users)}</span>
              </div>

              {/* Date + time */}
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleDateString('de-DE')}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

