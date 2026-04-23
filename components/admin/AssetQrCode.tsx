'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  qrCode: string | null
  assetId: string
}

export default function AssetQrCode({ qrCode, assetId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!qrCode) return
    const url = `${window.location.origin}/pwa/asset/${qrCode}`
    QRCode.toDataURL(url, { width: 256, margin: 2 }).then(setDataUrl)
  }, [qrCode])

  if (!qrCode) return (
    <div className="bg-white border rounded-xl p-6 flex items-center justify-center text-gray-400 text-sm h-40">
      Kein QR-Code vorhanden.
    </div>
  )

  return (
    <div className="bg-white border rounded-xl p-6 flex flex-col items-center gap-4">
      {dataUrl && <img src={dataUrl} alt="QR-Code" className="w-40 h-40" />}
      {dataUrl && (
        <div className="flex gap-3">
          <a
            href={dataUrl}
            download={`tolio-asset-${assetId}.png`}
            className="text-sm underline text-black"
          >
            Herunterladen
          </a>
          <button
            type="button"
            onClick={() => {
              const win = window.open('', '_blank')
              if (!win) return
              win.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh"><img src="${dataUrl}" onload="window.print();window.close()" /></body></html>`)
              win.document.close()
            }}
            className="text-sm underline text-black"
          >
            Drucken
          </button>
        </div>
      )}
    </div>
  )
}

