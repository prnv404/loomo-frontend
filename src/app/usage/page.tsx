'use client'

import React from 'react'
import ThemeSwitcher from '@/components/theme-switcher'
import ProfileMenu from '@/components/profile-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UsagePage() {
  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen overflow-x-hidden">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-background border-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-12 flex items-center justify-between px-1 sm:px-2">
          <span className="text-lg font-bold tracking-tight">Usage</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <ProfileMenu />
          </div>
        </div>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>App Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>This is a placeholder page. Add charts and stats here (scans per day, bills created, revenue impact, etc.).</p>
        </CardContent>
      </Card>
    </div>
  )
}
