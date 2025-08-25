'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Badge variant="destructive" className="gap-2">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    </div>
  )
}
