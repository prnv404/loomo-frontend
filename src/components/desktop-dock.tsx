'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calculator, FileText, Package, Megaphone, Users } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/bill', icon: Calculator, label: 'Bill' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/orders', icon: FileText, label: 'Orders' },
  { href: '/campaign/new', icon: Megaphone, label: 'Campaign' },
  { href: '/campaign', icon: Users, label: 'Customers' },
]

export default function DesktopDock() {
  const pathname = usePathname()

  const isActive = (item: typeof navItems[0]) => {
    if (item.href === '/dashboard') return pathname.startsWith('/dashboard')
    if (item.href === '/inventory') return pathname.startsWith('/inventory')
    if (item.href === '/orders') return pathname.startsWith('/orders')
    if (item.href === '/bill') return pathname.startsWith('/bill')
    if (item.href === '/campaign/new') return pathname.startsWith('/campaign/new')
    if (item.href === '/campaign') {
      return pathname === '/campaign' || (pathname.startsWith('/campaign') && !pathname.startsWith('/campaign/new'))
    }
    return pathname === item.href
  }

  return (
    <div className="hidden sm:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-end gap-3 rounded-2xl border bg-background/70 backdrop-blur-md shadow-xl ring-1 ring-black/5 dark:ring-white/5 px-3 py-2">
        {navItems.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className="group flex flex-col items-center justify-end"
            >
              <div
                className={`flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-200 will-change-transform ${
                  active
                    ? 'bg-black text-white dark:bg-accent dark:text-accent-foreground scale-110'
                    : 'bg-accent/40 text-foreground hover:scale-110'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="mt-1 text-[10px] leading-none text-muted-foreground group-hover:text-foreground">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

