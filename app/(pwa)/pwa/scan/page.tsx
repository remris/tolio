'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5QrcodeScanner } from 'html5-qrcode'
import PushSubscribeButton from '@/components/pwa/PushSubscribeButton'

export default function ScanPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    )

    scannerRef.current.render(
      (decodedText) => {
        scannerRef.current?.clear()
        // decodedText may be a full URL or just the UUID
        let qr = decodedText.trim()
        try {
          const url = new URL(qr)
          const parts = url.pathname.split('/')
          qr = parts[parts.length - 1]
        } catch {
          // not a URL, use as-is
        }
        router.push(`/pwa/asset/${qr}`)
      },
      () => {},
    )

    return () => {
      scannerRef.current?.clear().catch(() => {})
    }
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6">
      <h1 className="text-xl font-bold mb-4">QR-Code scannen</h1>
      <div className="mb-4">
        <PushSubscribeButton />
      </div>
      <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden" />
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  )
}

