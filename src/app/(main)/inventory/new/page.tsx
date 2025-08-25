'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BarcodeScanner from '@/components/barcode-scanner'
import { inventoryService } from '@/lib/inventory'
import { ArrowLeft, ScanLine } from 'lucide-react'
import ThemeSwitcher from '@/components/theme-switcher'
import ProfileMenu from '@/components/profile-menu'

export default function NewProductPage() {
  const router = useRouter()

  // Form fields
  const [barcode, setBarcode] = React.useState('')
  const [name, setName] = React.useState('')
  const [category, setCategory] = React.useState('SHIRTS')
  const [cost, setCost] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [scanNext, setScanNext] = React.useState(true)
  const [showScanner, setShowScanner] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const nameRef = React.useRef<HTMLInputElement | null>(null)
  const priceRef = React.useRef<HTMLInputElement | null>(null)

  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const q = '(max-width: 639px)'
    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : null
    const onChange = () => setIsMobile(mql ? mql.matches : false)
    onChange()
    mql?.addEventListener('change', onChange)
    return () => mql?.removeEventListener('change', onChange)
  }, [])

  // Category options from API with fallback
  const [categoryOptions, setCategoryOptions] = React.useState<string[]>([])
  const defaultCategory = React.useMemo(() => categoryOptions[0] || 'SHIRTS', [categoryOptions])

  React.useEffect(() => {
    let active = true
    inventoryService
      .categoriesAsync()
      .then((cats) => {
        if (!active) return
        const names = cats.map((c) => c.name)
        setCategoryOptions(names)
        // Initialize selection if current value is not in options
        if (!names.includes(category)) {
          setCategory(names[0] || 'SHIRTS')
        }
      })
      .catch(() => {
        // ignore; keep fallback
      })
    return () => {
      active = false
    }
  }, [])

  const canSave = name.trim() !== '' && category.trim() !== '' && !Number.isNaN(Number(price))

  const resetForm = (keepCategory = true) => {
    setBarcode('')
    setName('')
    if (!keepCategory) setCategory(defaultCategory)
    setCost('')
    setPrice('')
  }

  const onDetected = (code: string) => {
    setBarcode(code)
    // Move focus to name quickly for keyboard-first entry
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  const save = async (andNext: boolean) => {
    if (!canSave) return
    setSaving(true)
    try {
      await inventoryService.create({
        barcode: barcode.trim() || undefined,
        name: name.trim(),
        category: category.trim(),
        costPrice: Number(cost) || 0,
        sellingPrice: Number(price) || 0,
      })

      if (andNext) {
        const keepCat = category
        resetForm(true)
        setCategory(keepCat)
        if (scanNext) setShowScanner(true)
        setTimeout(() => nameRef.current?.focus(), 50)
      } else {
        router.push('/inventory')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen overflow-x-hidden">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background border-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-12 flex items-center justify-between px-1 sm:px-2">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link href="/inventory" aria-label="Back to inventory">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <span className="text-lg font-bold tracking-tight">Add Product</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <ProfileMenu />
            <Button variant="outline" onClick={() => save(true)} disabled={!canSave || saving}>
              Save & Add Next
            </Button>
            <Button onClick={() => save(false)} disabled={!canSave || saving}>
              Save
            </Button>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Barcode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Barcode</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowScanner((s) => !s)}>
                <ScanLine className="h-4 w-4 mr-1" /> {showScanner ? 'Hide Scanner' : 'Scan Barcode'}
              </Button>
            </div>
            <Input
              placeholder="Enter or scan barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              inputMode="numeric"
            />
            {showScanner && (
              <div className="mt-2">
                {isMobile ? (
                  <BarcodeScanner onDetected={onDetected} autoStart pauseOnDetected heightClass="h-48 sm:h-60" />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Camera scanning is unavailable on desktop. Use a hardware barcode scanner or enter the barcode manually.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                ref={nameRef}
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') priceRef.current?.focus()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cost Price</Label>
              <Input
                placeholder="0.00"
                type="number"
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                step="0.01"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Selling Price</Label>
              <Input
                ref={priceRef}
                placeholder="0.00"
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min={0}
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={scanNext} onChange={(e) => setScanNext(e.target.checked)} />
            Resume scanning for next item
          </label>
        </CardContent>
      </Card>
    </div>
  )
}
