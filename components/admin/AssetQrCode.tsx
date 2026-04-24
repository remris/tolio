'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  qrCode: string | null
  assetId: string
  assetName?: string
}

const STICKER_W = 340
const STICKER_H = 420
const PADDING = 20
const QR_SIZE = 220
const RADIUS = 16
const BRAND_COLOR = '#4F46E5'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function AssetQrCode({ qrCode, assetId, assetName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stickerRef = useRef<HTMLCanvasElement>(null)
  const [plainDataUrl, setPlainDataUrl] = useState<string | null>(null)
  const [stickerDataUrl, setStickerDataUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<'plain' | 'sticker'>('sticker')

  useEffect(() => {
    if (!qrCode) return
    const url = `${window.location.origin}/pwa/asset/${qrCode}`

    // Generate plain QR
    QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: '#111827', light: '#ffffff' } })
      .then(setPlainDataUrl)

    // Generate sticker on canvas
    QRCode.toDataURL(url, { width: QR_SIZE, margin: 0, color: { dark: '#111827', light: '#ffffff' } })
      .then((qrDataUrl) => {
        const canvas = stickerRef.current
        if (!canvas) return
        canvas.width = STICKER_W
        canvas.height = STICKER_H
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Background
        roundRect(ctx, 0, 0, STICKER_W, STICKER_H, RADIUS)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        // Border
        roundRect(ctx, 0, 0, STICKER_W, STICKER_H, RADIUS)
        ctx.strokeStyle = BRAND_COLOR
        ctx.lineWidth = 3
        ctx.stroke()

        // Top stripe
        ctx.beginPath()
        ctx.moveTo(0, RADIUS)
        ctx.lineTo(0, 52)
        ctx.lineTo(STICKER_W, 52)
        ctx.lineTo(STICKER_W, RADIUS)
        ctx.quadraticCurveTo(STICKER_W, 0, STICKER_W - RADIUS, 0)
        ctx.lineTo(RADIUS, 0)
        ctx.quadraticCurveTo(0, 0, 0, RADIUS)
        ctx.closePath()
        ctx.fillStyle = BRAND_COLOR
        ctx.fill()

        // Logo circle
        ctx.beginPath()
        ctx.arc(36, 26, 16, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.fill()

        // Logo letter T
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px system-ui'
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.fillText('T', 36, 27)

        // Brand name
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText('tolio', 60, 27)

        // "Asset" label
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '11px system-ui'
        ctx.textAlign = 'right'
        ctx.fillText('Asset-Sticker', STICKER_W - PADDING, 27)

        // QR code image
        const qrImg = new Image()
        qrImg.onload = () => {
          const qrX = (STICKER_W - QR_SIZE) / 2
          const qrY = 68
          ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE)

          // Asset name
          const name = assetName ?? `Asset ${assetId.slice(0, 8).toUpperCase()}`
          ctx.fillStyle = '#111827'
          ctx.font = 'bold 18px system-ui'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          // Truncate long names
          let displayName = name
          while (ctx.measureText(displayName).width > STICKER_W - PADDING * 2 - 10 && displayName.length > 4) {
            displayName = displayName.slice(0, -1)
          }
          if (displayName !== name) displayName += '…'
          ctx.fillText(displayName, STICKER_W / 2, qrY + QR_SIZE + 26)

          // ID
          const shortId = qrCode.slice(0, 8).toUpperCase()
          ctx.fillStyle = '#9ca3af'
          ctx.font = '12px monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`ID: ${shortId}`, STICKER_W / 2, qrY + QR_SIZE + 52)

          // Bottom line
          ctx.beginPath()
          ctx.moveTo(PADDING, STICKER_H - 36)
          ctx.lineTo(STICKER_W - PADDING, STICKER_H - 36)
          ctx.strokeStyle = '#e5e7eb'
          ctx.lineWidth = 1
          ctx.stroke()

          // Bottom brand
          ctx.fillStyle = '#d1d5db'
          ctx.font = '10px system-ui'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('powered by tolio · asset-management.app', STICKER_W / 2, STICKER_H - 18)

          setStickerDataUrl(canvas.toDataURL('image/png'))
        }
        qrImg.src = qrDataUrl
      })
  }, [qrCode, assetId, assetName])

  if (!qrCode) return (
    <div className="bg-white border rounded-xl p-6 flex items-center justify-center text-gray-400 text-sm h-40">
      Kein QR-Code vorhanden.
    </div>
  )

  const activeUrl = mode === 'sticker' ? stickerDataUrl : plainDataUrl
  const filename = mode === 'sticker'
    ? `tolio-sticker-${assetId.slice(0, 8)}.png`
    : `tolio-qr-${assetId.slice(0, 8)}.png`

  return (
    <div className="bg-white border rounded-xl p-6 flex flex-col items-center gap-4">
      {/* Hidden sticker canvas */}
      <canvas ref={stickerRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 w-full">
        {(['sticker', 'plain'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            {m === 'sticker' ? '🏷️ Sticker' : 'QR Code'}
          </button>
        ))}
      </div>

      {/* Preview */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {activeUrl
        ? <img src={activeUrl} alt={`QR Code${assetName ? ` – ${assetName}` : ''}`} className={mode === 'sticker' ? 'w-52' : 'w-40 h-40'} />
        : <div className="w-40 h-40 bg-gray-100 rounded-lg animate-pulse" />
      }

      {/* Actions */}
      {activeUrl && (
        <div className="flex gap-3 w-full">
          <a
            href={activeUrl}
            download={filename}
            className="flex-1 text-center text-sm font-medium border border-gray-200 rounded-lg py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Download
          </a>
          <button
            type="button"
            onClick={() => {
              const win = window.open('', '_blank')
              if (!win) return
              win.document.write(`<html lang="de"><head><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f3f4f6}img{max-width:340px}</style></head><body><img src="${activeUrl}" alt="tolio Asset QR Code" onload="window.print();window.close()" /></body></html>`)
              win.document.close()
            }}
            className="flex-1 text-sm font-medium border border-indigo-200 rounded-lg py-2 text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Drucken
          </button>
        </div>
      )}
    </div>
  )
}

