import type { Metadata, Viewport } from 'next'
import { Lexend } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { OfflineIndicator } from '@/components/offline-indicator'
import { InstallPrompt } from '@/components/install-prompt'
import { ThemeProvider } from '@/components/theme-provider'
import ClientAuthGate from '@/components/client-auth-gate'

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
})

export const metadata: Metadata = {
  title: {
    default: 'ProjectX Web',
    template: '%s | ProjectX Web',
  },
  description: 'A modern, production-ready Next.js application',
  keywords: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'PWA'],
  authors: [{ name: 'ProjectX Team' }],
  creator: 'ProjectX Team',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ProjectX Web',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'ProjectX Web',
    description: 'A modern, production-ready Next.js application',
    siteName: 'ProjectX Web',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProjectX Web',
    description: 'A modern, production-ready Next.js application',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={lexend.variable} suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          lexend.variable
        )}
      >
        <ThemeProvider defaultTheme="dark" storageKey="loomo-theme">
          <ClientAuthGate>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
              <OfflineIndicator />
              <InstallPrompt />
            </div>
          </ClientAuthGate>
        </ThemeProvider>
      </body>
    </html>
  )
}
