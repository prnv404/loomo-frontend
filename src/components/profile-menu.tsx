'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { authService } from '@/lib/auth'

export default function ProfileMenu() {
  const [open, setOpen] = React.useState(false)
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current || !btnRef.current) return
      if (!menuRef.current.contains(t) && !btnRef.current.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const doLogout = () => {
    authService.logout()
    router.push('/login')
  }

  return (
    <div className="relative">
      <Button
        ref={btnRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Profile menu"
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border bg-card text-foreground"
        onClick={() => setOpen((o) => !o)}
      >
        <User className="h-5 w-5" />
      </Button>
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow-lg z-50 p-1"
        >
          <Link
            href="/usage"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-md text-sm hover:bg-accent"
          >
            Usage
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-md text-sm hover:bg-accent"
          >
            Settings
          </Link>
          <button
            className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent"
            onClick={doLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
