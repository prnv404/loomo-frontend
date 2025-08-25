import BottomNavigation from '@/components/bottom-navigation'
import DesktopDock from '@/components/desktop-dock'
import ClientAuthGate from '@/components/client-auth-gate'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientAuthGate>
      <div className="relative">
        <main className="pb-16 sm:pb-0">
          {children}
        </main>
        <BottomNavigation />
        <DesktopDock />
      </div>
    </ClientAuthGate>
  )
}
