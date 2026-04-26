'use client'

import { useState } from 'react'
import Link from 'next/link'
import { History, Camera, X } from 'lucide-react'

const actionLabel: Record<string, string> = {
  check_out: 'Ausgecheckt',
  check_in: 'Zurückgegeben',
  broken: 'Defekt gemeldet',
  maintenance: 'Wartung',
}

const actionColors: Record<string, string> = {
  check_out: 'bg-amber-100 text-amber-700',
  check_in: 'bg-green-100 text-green-700',
  broken: 'bg-red-100 text-red-700',
  maintenance: 'bg-blue-100 text-blue-700',
}

const fuelLabels: Record<string, string> = {
  full: 'Voll',
  three_quarter: '¾',
  half: '½',
  quarter: '¼',
  empty: 'Leer',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogItem = Record<string, any>

interface Props {
  logs: LogItem[]
}

function DetailModal({ log, onClose }: { log: LogItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actionColors[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
              {actionLabel[log.action] ?? log.action}
            </span>
            {log.assets?.name && (
              <p className="text-sm font-semibold text-gray-900 mt-1">{log.assets.name}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Ersteller</span>
            <span className="font-medium text-gray-800">{log.users?.username ?? '–'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Datum & Uhrzeit</span>
            <span className="font-medium text-gray-800">
              {new Date(log.created_at).toLocaleString('de-DE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          {log.mileage != null && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Kilometerstand</span>
              <span className="font-medium text-gray-800">{log.mileage.toLocaleString('de-DE')} km</span>
            </div>
          )}
          {log.fuel_status && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Tankstatus</span>
              <span className="font-medium text-gray-800">{fuelLabels[log.fuel_status] ?? log.fuel_status}</span>
            </div>
          )}
          {log.note && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 mt-1">
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
                {log.photo_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 block shrink-0 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </a>
                ))}
              </div>
            </div>
          )}
          {log.asset_id && (
            <Link
              href={`/assets/${log.asset_id}`}
              onClick={onClose}
              className="block text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium pt-2"
            >
              Asset-Details anzeigen →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HistoryPageClient({ logs }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<LogItem | null>(null)

  const filtered = logs.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.assets?.name?.toLowerCase().includes(q) ||
      l.users?.username?.toLowerCase().includes(q) ||
      (actionLabel[l.action] ?? l.action).toLowerCase().includes(q)
    )
  })

  return (
    <>
      {selected && <DetailModal log={selected} onClose={() => setSelected(null)} />}

      <div className="max-w-4xl space-y-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" /> Historie
        </h1>

        <input
          type="text"
          placeholder="Suchen nach Asset, Mitarbeiter, Aktion..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">Keine Einträge gefunden.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">Asset</th>
                  <th className="text-left px-4 py-2.5">Aktion</th>
                  <th className="text-left px-4 py-2.5">Ersteller</th>
                  <th className="text-left px-4 py-2.5">Details</th>
                  <th className="text-left px-4 py-2.5">Datum & Uhrzeit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((log: LogItem) => {
                  const photos = log.photo_urls?.length ?? 0
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelected(log)}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="font-medium text-gray-900 hover:text-indigo-600"
                          onClick={e => { e.stopPropagation(); }}
                        >
                          {log.asset_id ? (
                            <Link
                              href={`/assets/${log.asset_id}`}
                              onClick={e => e.stopPropagation()}
                              className="hover:text-indigo-600"
                            >
                              {log.assets?.name ?? log.asset_id.slice(0, 8)}
                            </Link>
                          ) : '–'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                          {actionLabel[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.users?.username ?? '–'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {log.mileage != null && (
                            <span>{log.mileage.toLocaleString('de-DE')} km</span>
                          )}
                          {log.fuel_status && (
                            <span>Tank: {fuelLabels[log.fuel_status] ?? log.fuel_status}</span>
                          )}
                          {log.note && (
                            <span className="italic truncate max-w-[160px]">&bdquo;{log.note}&ldquo;</span>
                          )}
                          {photos > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                              <Camera className="w-3 h-3" />{photos > 1 ? `+${photos} Fotos` : '1 Foto'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
