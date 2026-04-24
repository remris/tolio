'use client'

import { useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Wrench, Loader2 } from 'lucide-react'

interface LogEntry {
  id: string
  asset_id: string
  user_id: string | null
  action: 'check_out' | 'check_in'
  note: string | null
  created_at: string
  assets: { name: string; type: string } | null
  users: { username: string } | null
}

const actionConfig = {
  check_out: { label: 'Ausgecheckt', icon: ArrowUpFromLine, color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500' },
  check_in: { label: 'Zurückgegeben', icon: ArrowDownToLine, color: 'text-green-600 bg-green-50', dot: 'bg-green-500' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PwaHistoryPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.ok ? r.json() : [])
      .then(d => setLogs(d ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-5 pb-4 bg-gray-50 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Historie</h1>
        <p className="text-gray-500 text-sm mt-0.5">Alle Aktivitäten</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Wrench className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          Noch keine Aktivitäten
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {logs.map(log => {
            const cfg = actionConfig[log.action] ?? actionConfig.check_out
            const Icon = cfg.icon
            return (
              <div key={log.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {log.assets?.name ?? 'Unbekanntes Asset'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cfg.label} · {log.users?.username ?? 'Unbekannt'}
                    </p>
                    {log.note && <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{log.note}&rdquo;</p>}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

