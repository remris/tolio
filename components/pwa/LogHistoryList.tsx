'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Image as ImageIcon } from 'lucide-react'

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
              className="w-full text-left flex items-start gap-3 text-sm rounded-xl p-2 -mx-2 hover:bg-gray-50 transition-colors"
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${actionDot[log.action] ?? 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-800">{actionLabel[log.action] ?? log.action}</span>
                <span className="text-gray-500"> von {getUsername(log.users)}</span>
                {log.note && <p className="text-xs text-gray-400 italic truncate">&bdquo;{log.note}&ldquo;</p>}
                {photoCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-500 mt-0.5">
                    <ImageIcon className="w-3 h-3" />
                    +{photoCount} Foto{photoCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                {new Date(log.created_at).toLocaleDateString('de-DE')}
              </span>
            </button>
          )
        })}
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 pb-24 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${actionDot[selected.action] ?? 'bg-gray-400'}`} />
                <h2 className="font-bold text-gray-900 text-lg">{actionLabel[selected.action] ?? selected.action}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p><span className="font-medium text-gray-700">Von:</span> {getUsername(selected.users)}</p>
              <p><span className="font-medium text-gray-700">Datum:</span> {new Date(selected.created_at).toLocaleString('de-DE')}</p>
              {selected.mileage != null && (
                <p><span className="font-medium text-gray-700">Kilometerstand:</span> {selected.mileage.toLocaleString('de-DE')} km</p>
              )}
              {selected.fuel_status && (
                <p><span className="font-medium text-gray-700">Tankstatus:</span> {fuelLabels[selected.fuel_status] ?? selected.fuel_status}</p>
              )}
              {selected.note && (
                <div className="mt-2 bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">Notiz</p>
                  <p className="text-gray-800 italic">&bdquo;{selected.note}&ldquo;</p>
                </div>
              )}
            </div>

            {selected.photo_urls && selected.photo_urls.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fotos</p>
                <div className="flex gap-2 flex-wrap">
                  {selected.photo_urls.map((url, i) => (
                    <div key={i} className="w-24 h-24 rounded-xl overflow-hidden border border-gray-100">
                      <Image src={url} alt={`Foto ${i + 1}`} width={96} height={96} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

