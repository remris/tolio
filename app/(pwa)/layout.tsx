import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'tolio',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'tolio' },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function PwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {children}
    </div>
  )
}

