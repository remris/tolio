'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ScanLine, Keyboard } from 'lucide-react'
import dynamic from 'next/dynamic'

const LiveScanner = dynamic(() => import('@/components/pwa/QrScanner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-900 rounded-2xl flex items-center justify-center animate-pulse">
      <ScanLine className="w-10 h-10 text-gray-600" />
    </div>
  ),
})

export default function ScanPage() {
  const router = useRouter()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [manualId, setManualId] = useState('')

  function handleManual(e: React.FormEvent) {
    e.preventDefault()
    const v = manualId.trim()
    if (v) router.push(`/pwa/asset/${v}`)
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scan a tool</h1>
        <p className="text-gray-500 text-sm mt-1">Point your camera at a QR code, or enter the ID manually.</p>
      </div>

      {/* Camera section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {!cameraOpen ? (
          <div className="flex flex-col items-center py-10 px-4 space-y-4">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
              <ScanLine className="w-9 h-9 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">Camera scanner</p>
              <p className="text-sm text-gray-500 mt-0.5">Allow camera access when prompted</p>
            </div>
            <button
              onClick={() => setCameraOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Open camera
            </button>
          </div>
        ) : (
          <div className="space-y-3 p-3">
            <LiveScanner />
            <button onClick={() => setCameraOpen(false)} className="w-full text-sm text-gray-500 py-2 hover:text-gray-700">
              Kamera schließen
            </button>
          </div>
        )}
      </div>

      {/* Manual input */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Keyboard className="w-4 h-4 text-gray-400" />
          Or enter tool ID
        </div>
        <form onSubmit={handleManual} className="flex gap-2">
          <input
            type="text"
            value={manualId}
            onChange={e => setManualId(e.target.value)}
            placeholder="DR-001 or full UUID"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!manualId.trim()}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Open
          </button>
        </form>
      </div>
    </div>
  )
}

