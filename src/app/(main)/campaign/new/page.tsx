'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ThemeSwitcher from '@/components/theme-switcher'
import ProfileMenu from '@/components/profile-menu'
import { ArrowLeft, Megaphone, Filter, Search } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string
  dob: string // ISO date
  totalSpent: number
  purchaseCount: number
  firstPurchaseDate: string // ISO date
}

const getAge = (dob: string) => {
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export default function CampaignBuilderPage() {
  const router = useRouter()

  // Campaign form
  const [name, setName] = React.useState('')
  const [pitch, setPitch] = React.useState('')
  const [description, setDescription] = React.useState('')

  // Filters
  const [query, setQuery] = React.useState('')
  const [minAge, setMinAge] = React.useState<string>('')
  const [maxAge, setMaxAge] = React.useState<string>('')
  const [newOnly, setNewOnly] = React.useState(false)
  const [highValueOnly, setHighValueOnly] = React.useState(false)
  const [frequentOnly, setFrequentOnly] = React.useState(false)

  // Mock customers
  const [customers] = React.useState<Customer[]>([
    { id: 'C001', name: 'Rahul', phone: '9876543210', dob: '1992-05-14', totalSpent: 12000, purchaseCount: 12, firstPurchaseDate: '2023-12-01' },
    { id: 'C002', name: 'Priya', phone: '9876501234', dob: '1995-09-01', totalSpent: 2200, purchaseCount: 2, firstPurchaseDate: '2025-08-10' },
    { id: 'C003', name: 'Amit', phone: '9876512345', dob: '1989-12-07', totalSpent: 8000, purchaseCount: 6, firstPurchaseDate: '2024-08-01' },
    { id: 'C004', name: 'Sneha', phone: '9876511111', dob: '2000-01-22', totalSpent: 3500, purchaseCount: 3, firstPurchaseDate: '2025-08-15' },
    { id: 'C005', name: 'Vikram', phone: '9876598765', dob: '1985-03-19', totalSpent: 16000, purchaseCount: 18, firstPurchaseDate: '2023-05-10' },
    { id: 'C006', name: 'Anita', phone: '9876587654', dob: '1998-11-02', totalSpent: 1200, purchaseCount: 1, firstPurchaseDate: '2025-08-20' },
    { id: 'C007', name: 'Karan', phone: '9876576543', dob: '1991-07-30', totalSpent: 5100, purchaseCount: 5, firstPurchaseDate: '2024-10-05' },
    { id: 'C008', name: 'Divya', phone: '9876565432', dob: '1993-04-12', totalSpent: 700, purchaseCount: 1, firstPurchaseDate: '2025-07-25' },
    { id: 'C009', name: 'Sanjay', phone: '9876554321', dob: '1980-06-08', totalSpent: 30000, purchaseCount: 30, firstPurchaseDate: '2022-02-18' },
    { id: 'C010', name: 'Neha', phone: '9876543200', dob: '1999-10-10', totalSpent: 5200, purchaseCount: 5, firstPurchaseDate: '2024-12-20' },
  ])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const now = new Date()
    const daysSince = (iso: string) => (now.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
    return customers.filter((c) => {
      if (q && !(c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.id.toLowerCase().includes(q))) return false
      const age = getAge(c.dob)
      if (minAge && age < Number(minAge)) return false
      if (maxAge && age > Number(maxAge)) return false
      if (newOnly && !(daysSince(c.firstPurchaseDate) <= 30)) return false
      if (highValueOnly && !(c.totalSpent >= 5000)) return false
      if (frequentOnly && !(c.purchaseCount >= 5)) return false
      return true
    })
  }, [customers, query, minAge, maxAge, newOnly, highValueOnly, frequentOnly])

  const canCreate = name.trim().length > 0 && filtered.length > 0

  const handleCreate = () => {
    if (!canCreate) return
    // Placeholder action
    alert(`Campaign "${name}" created for ${filtered.length} customers`)
    router.push('/campaign')
  }

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen overflow-x-hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background border-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-12 flex items-center justify-between px-1 sm:px-2">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link href="/campaign" aria-label="Back to Campaigns">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <span className="text-lg font-bold tracking-tight flex items-center gap-2"><Megaphone className="h-5 w-5" /> New Campaign</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <ProfileMenu />
            <Button onClick={handleCreate} disabled={!canCreate}>Create Campaign</Button>
          </div>
        </div>
      </div>

      {/* Campaign Details */}
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-name">Campaign Name</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Diwali Mega Sale" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-pitch">Catchy Sale Pitch</Label>
            <Input id="c-pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Flat 30% off on bestsellers!" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-desc">Description</Label>
            <textarea
              id="c-desc"
              className="w-full min-h-[90px] rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Describe your offer, T&Cs, time window, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Targeting */}
      <Card>
        <CardHeader>
          <CardTitle>Targeting Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search customers by name, phone, ID" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          {/* Age range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="min-age">Min Age</Label>
              <Input id="min-age" type="number" inputMode="numeric" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-age">Max Age</Label>
              <Input id="max-age" type="number" inputMode="numeric" min={0} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="opacity-0">Actions</Label>
              <Button type="button" variant="outline" onClick={() => { setMinAge(''); setMaxAge('') }}>Clear Ages</Button>
            </div>
          </div>
          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
              New customers (joined in last 30 days)
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={highValueOnly} onChange={(e) => setHighValueOnly(e.target.checked)} />
              High value (spent ≥ ₹5,000)
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={frequentOnly} onChange={(e) => setFrequentOnly(e.target.checked)} />
              Frequent (≥ 5 purchases)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Preview audience */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Audience Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">{filtered.length} of {customers.length} customers match</div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers match the current filters.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-2 text-left w-24">ID</th>
                    <th className="py-2 pr-2 text-left">Name</th>
                    <th className="py-2 pr-2 text-left w-36">Phone</th>
                    <th className="py-2 pr-2 text-left w-24">Age</th>
                    <th className="py-2 pr-2 text-left w-28">Spent</th>
                    <th className="py-2 pr-2 text-left w-28">Purchases</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-2 align-middle">{c.id}</td>
                      <td className="py-2 pr-2 align-middle">{c.name}</td>
                      <td className="py-2 pr-2 align-middle">{c.phone}</td>
                      <td className="py-2 pr-2 align-middle">{getAge(c.dob)}</td>
                      <td className="py-2 pr-2 align-middle">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                      <td className="py-2 pr-2 align-middle">{c.purchaseCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 flex items-center justify-end">
            <Button onClick={handleCreate} disabled={!canCreate}>Create Campaign</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
