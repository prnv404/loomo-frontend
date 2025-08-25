'use client'

import React from 'react'
import ThemeSwitcher from '@/components/theme-switcher'
import ProfileMenu from '@/components/profile-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type UserRole = 'admin' | 'staff'
type User = {
  id: string
  phone: string
  passcode: string
  role: UserRole
  invitedAt: string // ISO
}

export default function SettingsPage() {
  // Demo in-memory users list. Replace with API integration when backend is ready.
  const [users, setUsers] = React.useState<User[]>([
    {
      id: 'u-admin',
      phone: '9999999999',
      passcode: '0000',
      role: 'admin',
      invitedAt: new Date().toISOString(),
    },
  ])

  // Invite form
  const [invitePhone, setInvitePhone] = React.useState('')
  const [invitePasscode, setInvitePasscode] = React.useState('')

  const phoneDigits = invitePhone.replace(/\D/g, '')
  const passDigits = invitePasscode.replace(/\D/g, '')
  const canInvite = phoneDigits.length >= 10 && passDigits.length === 4

  const addUser = () => {
    if (!canInvite) return
    const exists = users.some((u) => u.phone === phoneDigits)
    const newUser: User = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      phone: phoneDigits,
      passcode: passDigits,
      role: 'staff',
      invitedAt: new Date().toISOString(),
    }
    setUsers((prev) => (exists ? prev : [newUser, ...prev]))
    setInvitePhone('')
    setInvitePasscode('')
  }

  const countAdmins = () => users.filter((u) => u.role === 'admin').length
  const promote = (id: string) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: 'admin' } : u)))
  const demote = (id: string) =>
    setUsers((prev) => {
      const target = prev.find((u) => u.id === id)
      if (!target) return prev
      if (target.role === 'admin' && countAdmins() <= 1) return prev // keep at least one admin
      return prev.map((u) => (u.id === id ? { ...u, role: 'staff' } : u))
    })
  const remove = (id: string) =>
    setUsers((prev) => {
      const target = prev.find((u) => u.id === id)
      if (!target) return prev
      if (target.role === 'admin' && countAdmins() <= 1) return prev // keep at least one admin
      return prev.filter((u) => u.id !== id)
    })

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen overflow-x-hidden">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-background border-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-12 flex items-center justify-between px-1 sm:px-2">
          <span className="text-lg font-bold tracking-tight">Settings</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <ProfileMenu />
          </div>
        </div>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" placeholder="Your Store" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input id="phone" type="tel" inputMode="numeric" placeholder="98765 43210" />
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Button type="button">Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite form */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="invite-phone">Phone Number</Label>
              <Input
                id="invite-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter phone number"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invite-pass">Passcode (4 digits)</Label>
              <Input
                id="invite-pass"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="1234"
                value={invitePasscode}
                onChange={(e) => setInvitePasscode(e.target.value)}
              />
            </div>
            <div className="flex items-end sm:col-span-1">
              <Button type="button" className="w-full" onClick={addUser} disabled={!canInvite}>
                Invite
              </Button>
            </div>
          </div>

          {/* Users list */}
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="max-h-[50vh] overflow-auto overflow-x-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-2 text-left">Phone</th>
                    <th className="py-2 pr-2 text-left w-28">Role</th>
                    <th className="py-2 pr-2 text-left w-48">Invited</th>
                    <th className="py-2 w-52 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const onlyAdmin = u.role === 'admin' && countAdmins() <= 1
                    return (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2 pr-2 align-middle font-mono">{u.phone}</td>
                        <td className="py-2 pr-2 align-middle">
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            u.role === 'admin' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2 pr-2 align-middle text-xs text-muted-foreground">
                          {new Date(u.invitedAt).toLocaleString()}
                        </td>
                        <td className="py-2 align-middle">
                          <div className="flex flex-wrap items-center gap-2">
                            {u.role === 'admin' ? (
                              <Button type="button" size="sm" variant="outline" onClick={() => demote(u.id)} disabled={onlyAdmin}>
                                Demote to Staff
                              </Button>
                            ) : (
                              <Button type="button" size="sm" onClick={() => promote(u.id)}>
                                Promote to Admin
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => remove(u.id)}
                              disabled={onlyAdmin}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
