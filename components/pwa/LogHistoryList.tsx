'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import BottomSheet from '@/components/pwa/BottomSheet'

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

interface LogItem {
  id: string
  action: string
  note: string | null
  created_at: string
  mileage?: number | null
  fuel_status?: string | null
  photo_urls?: string[] | null
  users?: { username: string } | { username: string }[] | null
}

function getUsername(users: LogItem['users']): string {
  if (!users) return '–'
  if (Array.isArray(users)) return users[0]?.username ?? '–'
  return users.username ?? '–'
}

interface Props {
  history: LogItem[]
}

export default function LogHistoryList({ history }: Props) {
  const [selected, setSelected] = useState<LogItem | null>(null)

  if (!history || history.length === 0) {
    return <p className="text-sm text-gray-400">Noch keine Aktivitäten.</p>
  }

  return (
    <>
      <div className="space-y-2">
        {history.map(log => {
          const photoCount = log.photo_urls?.length ?? 0
          return (
            <button
              key={log.id}
              onClick={() => setSelected(log)}
              className="w-full text-left flex items-start gap-3 text-sm rounded-xl p-3 -mx-2 hover:bg-gray-50 transition-colors"
            >
              <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${actionDot[log.action] ?? 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">{actionLabel[log.action] ?? log.action}</span>
                  {photoCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                      <Camera className="w-3 h-3" />
                      {photoCount > 1 ? `+${photoCount} Fotos` : '1 Foto'}
                    </span>
                  )}
                </div>
                <span className="text-gray-500 text-xs">von {getUsername(log.users)}</span>
                {log.note && <p className="text-xs text-gray-400 italic truncate mt-0.5">&bdquo;{log.note}&ldquo;</p>}
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5 text-right">
                <div>{new Date(log.created_at).toLocaleDateString('de-DE')}</div>
                <div>{new Date(log.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Modal */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? (actionLabel[selected.action] ?? selected.action) : undefined}
      >
        {selected && (
          <div className="space-y-3 text-sm text-gray-500">
            <p><span className="font-medium text-gray-700">Von:</span> {getUsername(selected.users)}</p>
            <p><span className="font-medium text-gray-700">Datum:</span> {new Date(selected.created_at).toLocaleString('de-DE')}</p>
            {selected.mileage != null && (
              <p><span className="font-medium text-gray-700">Kilometerstand:</span> {selected.mileage.toLocaleString('de-DE')} km</p>
            )}
            {selected.fuel_status && (
              <p><span className="font-medium text-gray-700">Tankstatus:</span> {fuelLabels[selected.fuel_status] ?? selected.fuel_status}</p>
            )}
            {selected.note && (
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Notiz</p>
                <p className="text-gray-800 italic">&bdquo;{selected.note}&ldquo;</p>
              </div>
            )}
            {selected.photo_urls && selected.photo_urls.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Fotos ({selected.photo_urls.length})
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selected.photo_urls.map((url, i) => (
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
        )}
      </BottomSheet>
    </>
  )
}

