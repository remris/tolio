'use client'

import { useEffect, useState, useCallback } from 'react'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { processPendingActions, countPendingActions } from '@/lib/offline/queue'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number } | null>(null)

  const refreshPending = useCallback(async () => {
    try { setPending(await countPendingActions()) } catch { /* IndexedDB not available */ }
  }, [])

  const sync = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const result = await processPendingActions()
      if (result.synced > 0) setSyncResult({ synced: result.synced })
      await refreshPending()
      setTimeout(() => setSyncResult(null), 4000)
    } finally {
      setSyncing(false)
    }
  }, [syncing, refreshPending])

  useEffect(() => {
    refreshPending()

    const onOnline = () => {
      setIsOnline(true)
      sync()
    }
    const onOffline = () => setIsOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Listen for SW sync-complete message
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SYNC_COMPLETE') refreshPending()
    }
    navigator.serviceWorker?.addEventListener('message', onMessage)

    // Poll pending count every 30s
    const interval = setInterval(refreshPending, 30_000)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      navigator.serviceWorker?.removeEventListener('message', onMessage)
      clearInterval(interval)
    }
  }, [sync, refreshPending])

  if (syncResult) {
    return (
      <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-full text-sm font-medium shadow-lg">
          <CheckCircle className="w-4 h-4" />
          {syncResult.synced} Aktion{syncResult.synced > 1 ? 'en' : ''} synchronisiert
        </div>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="fixed top-14 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span className="flex-1">Offline – Aktionen werden gespeichert und später synchronisiert</span>
      </div>
    )
  }

  if (pending > 0) {
    return (
      <div className="fixed top-14 left-0 right-0 z-50 bg-indigo-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium">
        <RefreshCw className={`w-4 h-4 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
        <span className="flex-1">{pending} ausstehende Aktion{pending > 1 ? 'en' : ''}</span>
        <button
          onClick={sync}
          disabled={syncing}
          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full disabled:opacity-50"
        >
          {syncing ? 'Sync…' : 'Jetzt sync'}
        </button>
      </div>
    )
  }

  return null
}

