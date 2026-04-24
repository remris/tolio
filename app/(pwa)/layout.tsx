import type { Metadata, Viewport } from 'next'
import PwaHeader from '@/components/pwa/PwaHeader'
import SwRegister from '@/components/shared/SwRegister'

export const metadata: Metadata = {
  title: 'tolio',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'tolio' },
}

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
}

export default function PwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <SwRegister />
      <PwaHeader />
      <main className="flex-1 pb-20">
        {children}
      </main>
    </div>
  )
}
