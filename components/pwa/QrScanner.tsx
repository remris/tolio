'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, AlertCircle, Loader2 } from 'lucide-react'

export default function QrScanner() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const [status, setStatus] = useState<'requesting' | 'scanning' | 'error' | 'success'>('requesting')
  const [errorMsg, setErrorMsg] = useState('')
  const [lastScanned, setLastScanned] = useState('')

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const handleResult = useCallback((text: string) => {
    if (lastScanned === text) return
    setLastScanned(text)
    setStatus('success')
    stopCamera()

    let qr = text.trim()
    try {
      const url = new URL(qr)
      const parts = url.pathname.split('/').filter(Boolean)
      qr = parts[parts.length - 1]
    } catch {
      // not a URL
    }
    router.push(`/pwa/asset/${qr}`)
  }, [lastScanned, router, stopCamera])

  useEffect(() => {
    let stopped = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('scanning')
        scan()
      } catch (e: unknown) {
        if (!stopped) {
          const name = (e as { name?: string })?.name
          setStatus('error')
          setErrorMsg(name === 'NotAllowedError'
            ? 'Kamerazugriff verweigert. Bitte Berechtigung erteilen.'
            : 'Kamera konnte nicht gestartet werden.')
        }
      }
    }

    async function scan() {
      if (stopped || !videoRef.current || !canvasRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scan)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      try {
        if ('BarcodeDetector' in window) {
          // @ts-expect-error - BarcodeDetector
          const detector = new BarcodeDetector({ formats: ['qr_code'] })
          const codes = await detector.detect(canvas)
          if (codes.length > 0) {
            handleResult(codes[0].rawValue)
            return
          }
        }
      } catch {}

      if (!stopped) {
        animFrameRef.current = requestAnimationFrame(scan)
      }
    }

    start()
    return () => {
      stopped = true
      stopCamera()
    }
  }, [handleResult, stopCamera])

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan overlay */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Corner markers */}
              {['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-8 h-8`}>
                  <div className="absolute top-0 left-0 w-8 h-1.5 bg-indigo-400 rounded-full" />
                  <div className="absolute top-0 left-0 w-1.5 h-8 bg-indigo-400 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="text-sm">Kamera wird gestartet…</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-600/80">
            <div className="text-center text-white space-y-2">
              <div className="text-4xl">✓</div>
              <p className="text-sm font-medium">QR-Code erkannt</p>
            </div>
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{errorMsg}</p>
            <button
              onClick={() => { setStatus('requesting'); setLastScanned('') }}
              className="mt-2 text-xs text-red-600 underline"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      )}

      {status === 'scanning' && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Camera className="w-4 h-4" />
          <span>Halte den QR-Code in den Rahmen</span>
        </div>
      )}

      {/* Fallback: html5-qrcode hidden input for unsupported browsers */}
      {status === 'error' && (
        <div className="w-full max-w-sm">
          <p className="text-xs text-gray-400 text-center mb-2">Alternativ: QR-Code-Wert eingeben</p>
          <form
            onSubmit={e => {
              e.preventDefault()
              const val = (e.currentTarget.elements.namedItem('manual') as HTMLInputElement).value.trim()
              if (val) handleResult(val)
            }}
            className="flex gap-2"
          >
            <input
              name="manual"
              type="text"
              placeholder="QR-Code oder Asset-ID"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              Go
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

