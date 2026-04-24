'use client'

import { Wrench } from 'lucide-react'

export default function PwaTopBar() {
  return (
    <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-40">
      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
        <Wrench className="w-5 h-5 text-white" />
      </div>
      <span className="font-bold text-gray-900 text-base">tolio</span>
    </header>
  )
}
