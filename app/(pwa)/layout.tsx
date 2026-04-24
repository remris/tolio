import type { Metadata, Viewport } from 'next'
import PwaTopBar from '@/components/pwa/PwaTopBar'
import PwaBottomNav from '@/components/pwa/PwaBottomNav'
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
  maximumScale: 1,
}

export default function PwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SwRegister />
      <PwaTopBar />
      <main className="flex-1 pb-24">
        {children}
      </main>
      <PwaBottomNav />
    </div>
  )
}

