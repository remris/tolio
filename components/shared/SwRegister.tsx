'use client'

import { useEffect } from 'react'
import { processPendingActions } from '@/lib/offline/queue'

export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Register background sync
      if ('sync' in reg) {
        window.addEventListener('online', () => {
          (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync
            .register('tolio-sync').catch(() => {})
        })
      }
    }).catch(console.error)

    // Listen for SW TRIGGER_SYNC message (from background sync event)
    const onMessage = async (e: MessageEvent) => {
      if (e.data?.type === 'TRIGGER_SYNC') {
        await processPendingActions()
        navigator.serviceWorker.controller?.postMessage({ type: 'SYNC_COMPLETE' })
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  return null
}

