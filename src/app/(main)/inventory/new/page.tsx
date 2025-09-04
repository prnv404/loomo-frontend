'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inventoryService } from '@/lib/inventory'
import { ArrowLeft } from 'lucide-react'
import ThemeSwitcher from '@/components/theme-switcher'
import ProfileMenu from '@/components/profile-menu'

export default function NewProductPage() {
  const router = useRouter()

  // Form fields
  const [name, setName] = React.useState('')
  const [category, setCategory] = React.useState('SHIRTS')
  const [cost, setCost] = React.useState('')
  const [price, setPrice] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [sizes, setSizes] = React.useState<string[]>([])
  const [colors, setColors] = React.useState<string[]>([])
  const [stockQty, setStockQty] = React.useState('')
  const [offerType, setOfferType] = React.useState<'NONE' | 'PERCENTAGE' | 'FLAT'>('NONE')
  const [offerValue, setOfferValue] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [images, setImages] = React.useState<string[]>([])

  const nameRef = React.useRef<HTMLInputElement | null>(null)
  const priceRef = React.useRef<HTMLInputElement | null>(null)

  // Category options from API with fallback
  const [categoryOptions, setCategoryOptions] = React.useState<string[]>([])
  const defaultCategory = React.useMemo(() => categoryOptions[0] || 'SHIRTS', [categoryOptions])
  const sizeOptions = React.useMemo(() => ['XS', 'S', 'M', 'L', 'XL', 'XXL'], [])
  const colorOptions = React.useMemo(
    () => ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Grey', 'Brown', 'Pink', 'Purple'],
    []
  )

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

  const priceNum = Math.max(0, Number(price) || 0)
  const costNum = Math.max(0, Number(cost) || 0)
  const stockNum = Math.max(0, Math.floor(Number(stockQty) || 0))
  const offerValNum = Math.max(0, Number(offerValue) || 0)
  const effectivePrice = React.useMemo(() => {
    let p = priceNum
    if (offerType === 'PERCENTAGE') p = Math.max(0, p - (p * offerValNum) / 100)
    if (offerType === 'FLAT') p = Math.max(0, p - offerValNum)
    return p
  }, [priceNum, offerType, offerValNum])
  const offerError = React.useMemo(() => {
    if (offerType === 'NONE') return null
    if (offerType === 'PERCENTAGE' && offerValNum > 100) return 'Percentage cannot exceed 100%'
    if (offerType === 'FLAT' && offerValNum > priceNum) return 'Flat discount cannot exceed price'
    return null
  }, [offerType, offerValNum, priceNum])
  const canSave =
    name.trim() !== '' &&
    category.trim() !== '' &&
    !Number.isNaN(Number(price)) &&
    priceNum >= 0 &&
    costNum >= 0 &&
    stockNum >= 0 &&
    !offerError

  const resetForm = (keepCategory = true) => {
    setName('')
    if (!keepCategory) setCategory(defaultCategory)
    setCost('')
    setPrice('')
    setDescription('')
    setSizes([])
    setColors([])
    setStockQty('')
    setOfferType('NONE')
    setOfferValue('')
    setImages([])
  }

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleImagesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const MAX = 6
    const room = Math.max(0, MAX - images.length)
    if (room <= 0) {
      e.target.value = ''
      return
    }
    const toAdd = files.slice(0, room)
    const dataUrls = await Promise.all(toAdd.map(fileToDataUrl))
    setImages((prev) => [...prev, ...dataUrls])
    e.target.value = ''
  }

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const save = async (andNext: boolean) => {
    if (!canSave) return
    setSaving(true)
    try {
      await inventoryService.create({
        name: name.trim(),
        category: category.trim(),
        costPrice: Number(cost) || 0,
        sellingPrice: Number(price) || 0,
        description: description.trim() || undefined,
        sizes,
        colors,
        stockQuantity: stockNum,
        offerType,
        offerValue: offerType === 'NONE' ? 0 : offerValNum,
        images,
      })

      if (andNext) {
        const keepCat = category
        resetForm(true)
        setCategory(keepCat)
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

          {/* Sizes & Colors (multi-select) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Sizes</Label>
              <select
                multiple
                className="w-full min-h-[2.5rem] rounded-md border bg-background px-2 text-sm"
                value={sizes}
                onChange={(e) =>
                  setSizes(Array.from(e.target.selectedOptions).map((o) => o.value))
                }
              >
                {sizeOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
            </div>
            <div className="space-y-2">
              <Label>Colors</Label>
              <select
                multiple
                className="w-full min-h-[2.5rem] rounded-md border bg-background px-2 text-sm"
                value={colors}
                onChange={(e) =>
                  setColors(Array.from(e.target.selectedOptions).map((o) => o.value))
                }
              >
                {colorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
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

          {/* Offers & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Offer Type</Label>
              <select
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                value={offerType}
                onChange={(e) => setOfferType(e.target.value as any)}
              >
                <option value="NONE">None</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{offerType === 'PERCENTAGE' ? 'Offer (%)' : 'Offer Amount'}</Label>
              <Input
                placeholder={offerType === 'PERCENTAGE' ? '0 - 100' : '0.00'}
                type="number"
                inputMode="decimal"
                value={offerValue}
                onChange={(e) => setOfferValue(e.target.value)}
                step="0.01"
                min={0}
                max={offerType === 'PERCENTAGE' ? 100 : undefined}
              />
              {offerError && <p className="text-xs text-red-500">{offerError}</p>}
            </div>
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input
                placeholder="0"
                type="number"
                inputMode="numeric"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                step={1}
                min={0}
              />
            </div>
          </div>

          {/* Effective price preview */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Effective Price</span>
            <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(effectivePrice)}</span>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images</Label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesSelected}
              className="block text-sm"
            />
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((src, idx) => (
                  <div key={idx} className="relative border rounded overflow-hidden">
                    <img src={src} alt={`Image ${idx + 1}`} className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded"
                      onClick={() => removeImage(idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{images.length}/6 images</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="w-full h-28 rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Describe the product (materials, fit, care, etc.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
