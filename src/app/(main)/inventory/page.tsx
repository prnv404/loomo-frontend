'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { inventoryService, type Product, type ListResult } from '@/lib/inventory'
import BarcodeScanner from '@/components/barcode-scanner'
import { Plus, Search, Filter, ScanLine, X, Pencil, ChevronDown } from 'lucide-react'
import ThemeSwitcher from '@/components/theme-switcher'
import ProfileMenu from '@/components/profile-menu'
import Link from 'next/link'

const currency = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v)

const useDebounced = (value: string, delay = 300) => {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function InventoryPage() {
  // Filters & sorting
  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebounced(search, 300)
  const [category, setCategory] = React.useState<string>('All')
  const [sortBy, setSortBy] = React.useState<'name' | 'category' | 'createdAt' | 'updatedAt' | 'sellingPrice'>('updatedAt')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [pageSize, setPageSize] = React.useState<number>(50)

  // Listing state
  const [page, setPage] = React.useState(1)
  const [items, setItems] = React.useState<Product[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Create/Edit modal state
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Product | null>(null)

  // Create form fields
  const [fBarcode, setFBarcode] = React.useState('')
  const [fName, setFName] = React.useState('')
  const [fCategory, setFCategory] = React.useState('Shirts')
  const [fCost, setFCost] = React.useState('')
  const [fPrice, setFPrice] = React.useState('')
  const [scanNext, setScanNext] = React.useState(true)
  const [showScanner, setShowScanner] = React.useState(false)
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

  // Category options from API
  const [categoryOptions, setCategoryOptions] = React.useState<string[]>(['All'])
  const modalCategoryOptions = React.useMemo(() => categoryOptions.filter((c) => c !== 'All'), [categoryOptions])
  const defaultCategory = React.useMemo(() => modalCategoryOptions[0] || 'SHIRTS', [modalCategoryOptions])

  React.useEffect(() => {
    let active = true
    inventoryService
      .categoriesAsync()
      .then((cats) => {
        if (!active) return
        const names = cats.map((c) => c.name)
        setCategoryOptions(['All', ...names])
      })
      .catch(() => {
        // ignore; keep fallback
      })
    return () => {
      active = false
    }
  }, [])

  const resetForm = () => {
    setEditing(null)
    setFBarcode('')
    setFName('')
    setFCategory(defaultCategory)
    setFCost('')
    setFPrice('')
    setShowScanner(false)
    setScanNext(true)
  }

  // Create handled via Link in the button below

  const openEdit = (p: Product) => {
    setEditing(p)
    setFBarcode(p.barcode || '')
    setFName(p.name)
    setFCategory(p.category)
    setFCost(String(p.costPrice))
    setFPrice(String(p.sellingPrice))
    setShowScanner(false)
    setModalOpen(true)
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const fetchPage = async (pageNum: number, replace = false) => {
    setLoading(true)
    setError(null)
    try {
      const res: ListResult = await inventoryService.list({
        search: debouncedSearch,
        category,
        sortBy,
        sortDir,
        page: pageNum,
        pageSize,
      })
      setTotal(res.total)
      setItems((prev) => (replace ? res.items : [...prev, ...res.items]))
    } catch (e: any) {
      setError(e?.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  // Initial + on filters
  React.useEffect(() => {
    setPage(1)
    fetchPage(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, sortBy, sortDir, pageSize])

  const loadMore = () => {
    if (items.length >= total || loading) return
    const next = page + 1
    setPage(next)
    fetchPage(next, false)
  }

  // Handle barcode detected inside modal
  const onDetected = (code: string) => {
    setFBarcode(code)
    // If barcode exists in current list, prefill/alert
    const existing = items.find((i) => i.barcode && i.barcode === code)
    if (existing) {
      // Prefill from existing to speed edits
      setFName(existing.name)
      setFCategory(existing.category)
      setFCost(String(existing.costPrice))
      setFPrice(String(existing.sellingPrice))
    }
    // Move focus to name then price for speed
    setTimeout(() => nameRef.current?.focus(), 50)
  }

  const canSave = fName.trim() && fCategory.trim() && (Number(fPrice) || 0) >= 0

  const doSave = async (andNext: boolean) => {
    if (!canSave) return
    setSaving(true)
    try {
      if (editing) {
        await inventoryService.update(editing.id, {
          barcode: fBarcode.trim() || undefined,
          name: fName.trim(),
          category: fCategory.trim(),
          costPrice: Number(fCost) || 0,
          sellingPrice: Number(fPrice) || 0,
        })
      } else {
        await inventoryService.create({
          barcode: fBarcode.trim() || undefined,
          name: fName.trim(),
          category: fCategory.trim(),
          costPrice: Number(fCost) || 0,
          sellingPrice: Number(fPrice) || 0,
        })
      }
      // Refresh first page to reflect latest
      setPage(1)
      await fetchPage(1, true)

      if (andNext) {
        const keepCategory = fCategory
        resetForm()
        setFCategory(keepCategory)
        setModalOpen(true)
        if (scanNext) setShowScanner(true)
        setTimeout(() => nameRef.current?.focus(), 50)
      } else {
        closeModal()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen overflow-x-hidden">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-background border-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-12 flex items-center justify-between px-1 sm:px-2">
          <span className="text-lg font-bold tracking-tight">Inventory</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Find Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <div className="sm:col-span-2 flex items-center gap-2">
              <div className="relative w-full">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search name, category, or barcode"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
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
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              <select
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="updatedAt">Updated</option>
                <option value="createdAt">Created</option>
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="sellingPrice">Price</option>
              </select>
              <select
                className="w-28 h-9 rounded-md border bg-background px-2 text-sm"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as any)}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page size</span>
              <select
                className="w-24 h-9 rounded-md border bg-background px-2 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="sm:col-span-1 flex items-center justify-end">
              <Button asChild type="button">
                <Link href="/inventory/new">
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">{items.length} of {total} loaded</div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">No products found.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
              {/* Mobile stacked */}
              <div className="sm:hidden divide-y">
                {items.map((p) => (
                  <div key={p.id} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium break-words">{p.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">{p.category}</Badge>
                          {p.barcode ? <span className="font-mono">{p.barcode}</span> : <span className="italic">No barcode</span>}
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="font-medium">{currency(p.sellingPrice)}</span>
                          <span className="text-xs text-muted-foreground ml-2">Cost {currency(p.costPrice)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-2">Name</th>
                      <th className="py-2 pr-2 w-36">Category</th>
                      <th className="py-2 pr-2 w-48">Barcode</th>
                      <th className="py-2 pr-2 w-28 text-right">Cost</th>
                      <th className="py-2 pr-2 w-28 text-right">Price</th>
                      <th className="py-2 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 pr-2 align-top min-w-0">
                          <div className="font-medium leading-tight break-words">{p.name}</div>
                          <div className="text-xs text-muted-foreground">Updated {new Date(p.updatedAt).toLocaleString()}</div>
                        </td>
                        <td className="py-2 pr-2 align-middle">
                          <Badge variant="secondary">{p.category}</Badge>
                        </td>
                        <td className="py-2 pr-2 align-middle font-mono truncate">{p.barcode || '—'}</td>
                        <td className="py-2 pr-2 align-middle text-right">{currency(p.costPrice)}</td>
                        <td className="py-2 pr-2 align-middle text-right font-medium">{currency(p.sellingPrice)}</td>
                        <td className="py-2 align-middle">
                          <Button type="button" size="sm" variant="outline" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Load more */}
              <div className="py-3 flex items-center justify-center">
                <Button type="button" variant="outline" onClick={loadMore} disabled={loading || items.length >= total}>
                  {items.length >= total ? 'All loaded' : loading ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-lg bg-background shadow-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editing ? 'Edit Product' : 'Add Product'}</CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scan section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Barcode</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowScanner((s) => !s)}>
                    <ScanLine className="h-4 w-4 mr-1" /> {showScanner ? 'Hide Scanner' : 'Scan Barcode'}
                  </Button>
                </div>
                <Input
                  placeholder="Enter or scan barcode"
                  value={fBarcode}
                  onChange={(e) => setFBarcode(e.target.value)}
                  inputMode="numeric"
                />
                {showScanner && (
                  <div className="mt-2">
                    {isMobile ? (
                      <BarcodeScanner onDetected={onDetected} autoStart pauseOnDetected heightClass="h-40 sm:h-48" />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Camera scanning is unavailable on desktop. Use a hardware barcode scanner or enter the barcode manually.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    ref={nameRef}
                    placeholder="Product name"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value)}
                  >
                    {modalCategoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Cost Price</Label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    inputMode="decimal"
                    value={fCost}
                    onChange={(e) => setFCost(e.target.value)}
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
                    value={fPrice}
                    onChange={(e) => setFPrice(e.target.value)}
                    step="0.01"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={scanNext} onChange={(e) => setScanNext(e.target.checked)} />
                  Resume scanning for next item
                </label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => doSave(true)} disabled={!canSave || saving}>
                    Save & Add Next
                  </Button>
                  <Button type="button" onClick={() => doSave(false)} disabled={!canSave || saving}>
                    {editing ? 'Save Changes' : 'Save'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
