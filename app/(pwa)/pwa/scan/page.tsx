'use client'

import dynamic from 'next/dynamic'
import { QrCode } from 'lucide-react'

const QrScanner = dynamic(() => import('@/components/pwa/QrScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-sm aspect-square bg-gray-900 rounded-2xl flex items-center justify-center">
        <QrCode className="w-12 h-12 text-gray-600 animate-pulse" />
      </div>
    </div>
  ),
})

export default function ScanPage() {
  return (
    <div className="space-y-4 pt-2">
      <div className="px-4">
        <h1 className="text-xl font-bold text-gray-900">QR-Code scannen</h1>
        <p className="text-sm text-gray-500 mt-0.5">Asset aus- oder einchecken</p>
      </div>
      <QrScanner />
    </div>
  )
}

