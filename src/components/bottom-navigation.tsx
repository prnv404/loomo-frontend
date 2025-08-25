'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calculator, FileText, Bot, Package } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/bill', icon: Calculator, label: 'Bill' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/orders', icon: FileText, label: 'Orders' },
  { href: '/campaign', icon: Bot, label: 'More' },
]

export default function BottomNavigation() {
  const pathname = usePathname()

  const isActive = (item: typeof navItems[0]) => {
    return (
      pathname === item.href ||
      (item.href === '/dashboard' && pathname.startsWith('/dashboard')) ||
      (item.href === '/inventory' && pathname.startsWith('/inventory')) ||
      (item.href === '/orders' && pathname.startsWith('/orders')) ||
      (item.href === '/campaign' && ['/customers', '/marketing', '/accounts', '/campaign'].includes(pathname)) ||
      (item.href === '/bill' && pathname.startsWith('/bill'))
    )
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.06)] sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 mx-auto max-w-screen-sm h-full px-2 gap-2">
        {navItems.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={`flex flex-col items-center justify-center rounded-lg p-2 text-xs transition-colors ${
                active
                  ? 'bg-black text-white dark:bg-accent dark:text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
