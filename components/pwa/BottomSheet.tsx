'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, subtitle, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl px-5 pt-5 w-full max-w-lg shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            {subtitle && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{subtitle}</p>}
            {title && <h2 className="text-xl font-bold text-gray-900 mt-0.5">{title}</h2>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto max-h-[70vh] pb-2">
          {children}
        </div>
      </div>
    </div>
  )
}

