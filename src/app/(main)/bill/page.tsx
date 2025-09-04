'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, MinusCircle, X, Bot, MessageSquare, Calendar as CalendarIcon } from 'lucide-react'
import ThemeSwitcher from '@/components/theme-switcher'
import ProfileMenu from '@/components/profile-menu'
import billingService, { type CreateOrderInput } from '@/lib/billing'
import { useToast } from '@/components/ui/toast'
import { formatApiError } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

// Types
type Category = 'Shirts' | 'Pants' | 'Shoes' | 'Accessories' | 'Custom'

type BillItem = {
  id: string
  name: string
  category: Category
  quantity: number
  price: number // per unit
  productId?: number
  stock?: number
}

const formatINR = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)

export default function BillPage() {
  // (Removed manual Add Item form)

  // Bill state
  const [billItems, setBillItems] = React.useState<BillItem[]>([])

  // Mode & Quick bill state (force Quick Total)
  const [mode, setMode] = React.useState<'items' | 'quick'>('quick')
  const [manualSubtotal, setManualSubtotal] = React.useState<string>('0')
  const [manualDiscount, setManualDiscount] = React.useState<string>('0')

  // Finalize state
  const [discount, setDiscount] = React.useState<string>('0')
  const [customerPhone, setCustomerPhone] = React.useState('')
  const [customerName, setCustomerName] = React.useState('')
  const [customerDob, setCustomerDob] = React.useState('') // using native date input as calendar fallback
  const [creatingOrder, setCreatingOrder] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const { addToast } = useToast()
  const handleGenerateBillItems = async () => {
    try {
      setCreateError(null)
      setCreatingOrder(true)
      const items = billItems
        .filter((it) => typeof it.productId === 'number')
        .map((it) => ({
          product_id: it.productId as number,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 0,
        }))
      const input: CreateOrderInput = {
        customer_name: customerName || undefined,
        customer_phone: customerPhone,
        dob: customerDob || undefined,
        order_items: items,
        discount: Math.min(discountValue, subtotal),
        sub_total: subtotal,
      }
      const res = await billingService.createOrderSafe(input)
      if (res.errors) {
        const msg = formatApiError(res.errors, '')
        setCreateError(msg || null)
        if (msg) addToast({ title: msg, variant: 'destructive' })
        return
      }
      const result = res.data
      // Basic confirmation and reset bill (treat as success when data is present)
      if (result) {
        addToast({
          title: 'Order created',
          description: result.invoice_number
            ? `Invoice ${result.invoice_number}. Total ${formatINR(result.total)}`
            : `Total ${formatINR(result.total)}`,
        })
        setBillItems([])
        setDiscount('0')
        // keep customer fields for convenience
      }
    } catch (e: any) {
      const msg = e?.message || ''
      setCreateError(msg || null)
      if (msg) addToast({ title: msg, variant: 'destructive' })
    } finally {
      setCreatingOrder(false)
    }
  }

  const handleGenerateQuickBill = async () => {
    try {
      setCreateError(null)
      setCreatingOrder(true)
      const input: CreateOrderInput = {
        customer_name: customerName || undefined,
        customer_phone: customerPhone,
        dob: customerDob || undefined,
        order_items: [],
        discount: Math.min(manualDiscountNum, manualSubtotalNum),
        sub_total: manualSubtotalNum,
      }
      const res = await billingService.createOrderSafe(input)
      if (res.errors) {
        const msg = formatApiError(res.errors, '')
        setCreateError(msg || null)
        if (msg) addToast({ title: msg, variant: 'destructive' })
        return
      }
      const result = res.data
      if (result) {
        addToast({
          title: 'Order created',
          description: result.invoice_number
            ? `Invoice ${result.invoice_number}. Total ${formatINR(result.total)}`
            : `Total ${formatINR(result.total)}`,
        })
        // Reset quick bill inputs (keep customer fields for convenience)
        setManualSubtotal('0')
        setManualDiscount('0')
      }
    } catch (e: any) {
      const msg = e?.message || ''
      setCreateError(msg || null)
      if (msg) addToast({ title: msg, variant: 'destructive' })
    } finally {
      setCreatingOrder(false)
    }
  }

  // Derived totals (items mode)
  const subtotal = billItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountValue = Math.max(0, parseFloat(discount || '0') || 0)
  const total = Math.max(0, subtotal - discountValue)

  // Derived totals (quick mode)
  const manualSubtotalNum = Math.max(0, parseFloat(manualSubtotal || '0') || 0)
  const manualDiscountNum = Math.max(0, parseFloat(manualDiscount || '0') || 0)
  const manualTotal = Math.max(0, manualSubtotalNum - manualDiscountNum)

  // Validation: discount should not exceed subtotal
  const discountTooHigh = discountValue > subtotal
  const manualDiscountTooHigh = manualDiscountNum > manualSubtotalNum

  const phoneValid = /^[0-9]{10}$/.test(customerPhone.trim())
  const phoneError = customerPhone.trim().length === 0 ? 'Phone is required' : phoneValid ? null : 'Enter a valid 10-digit phone number'
  const stockOk = billItems.every((it) => it.stock == null || it.quantity <= it.stock)
  const allHaveProductIds = billItems.every((it) => typeof it.productId === 'number')
  const canFinalizeItems = phoneValid && billItems.length > 0 && allHaveProductIds && stockOk && !creatingOrder && !discountTooHigh
  const canFinalizeQuick = phoneValid && manualSubtotalNum > 0 && !creatingOrder && !manualDiscountTooHigh

  // Scanner state and refs
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const controlsRef = React.useRef<any>(null) // @zxing controls
  const detectorStopRef = React.useRef<null | (() => void)>(null) // BarcodeDetector loop stopper
  const [wantScanning, setWantScanning] = React.useState(false)
  const [scanning, setScanning] = React.useState(false)
  const [scanError, setScanError] = React.useState<string | null>(null)
  const lastScanRef = React.useRef<{ value: string; at: number } | null>(null)
  const startingRef = React.useRef(false) // guard against double start
  const [detectedInfo, setDetectedInfo] = React.useState<{
    code: string
    item: BillItem
  } | null>(null)
  const [detectedPrice, setDetectedPrice] = React.useState<string>('')
  const [detectedLoading, setDetectedLoading] = React.useState(false)
  const [detectedError, setDetectedError] = React.useState<string | null>(null)
  const [detectedStock, setDetectedStock] = React.useState<number | null>(null)
  const [detectedProductId, setDetectedProductId] = React.useState<number | null>(null)

  // Viewport gating (mobile vs desktop)
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(max-width: 639px)').matches
  })
  const hardwareInputRef = React.useRef<HTMLInputElement | null>(null)
  const [hardwareCode, setHardwareCode] = React.useState('')

  // Audio beep on detection
  const audioCtxRef = React.useRef<any>(null)
  const ensureAudio = async () => {
    try {
      const AC = (typeof window !== 'undefined' && ((window as any).AudioContext || (window as any).webkitAudioContext)) as any
      if (!AC) return
      if (!audioCtxRef.current) audioCtxRef.current = new AC()
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume()
    } catch {}
  }
  const beep = () => {
    try {
      const ctx = audioCtxRef.current
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      // A bit brighter tone and louder
      osc.type = 'square'
      osc.frequency.value = 1100
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.24)
      osc.onended = () => { try { osc.disconnect(); gain.disconnect() } catch {} }
    } catch {}
  }

  // Haptic feedback (Vibration API). No-op where unsupported (iOS Safari/PWA).
  const haptic = () => {
    try {
      if (typeof navigator !== 'undefined' && typeof (navigator as any).vibrate === 'function') {
        // short, crisp pulse
        (navigator as any).vibrate(50)
      }
    } catch {}
  }

  // Product details are fetched from backend on scan

  const onDetected = (raw: string) => {
    const now = Date.now()
    if (lastScanRef.current && lastScanRef.current.value === raw && now - lastScanRef.current.at < 1200) {
      return // ignore rapid duplicate
    }
    lastScanRef.current = { value: raw, at: now }
    beep()
    haptic()
    // Show dialog in loading state
    setDetectedLoading(true)
    setDetectedError(null)
    setDetectedStock(null)
    setDetectedProductId(null)
    setDetectedInfo({
      code: raw,
      item: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Loading…',
        category: 'Custom',
        quantity: 1,
        price: 0,
      },
    })
    setDetectedPrice('')
    stopScanner()
    setWantScanning(false)
    billingService
      .productByCodeSafe(raw)
      .then((res) => {
        if (res.errors) {
          const msg = formatApiError(res.errors, '')
          setDetectedError(msg || null)
          if (msg) addToast({ title: msg, variant: 'destructive' })
          return
        }
        const p = res.data
        if (p) {
          setDetectedInfo((prev) =>
            prev
              ? {
                  ...prev,
                  item: {
                    ...prev.item,
                    name: p.name || `Scanned Item (${raw})`,
                    price: Number(p.price) || 0,
                  },
                }
              : null
          )
          setDetectedPrice(String(Number(p.price) || 0))
          setDetectedStock(Number(p.stock_quantity) || 0)
          setDetectedProductId(Number(p.id))
        } else {
          // Product not found is not an error from backend; allow manual entry
          setDetectedInfo((prev) =>
            prev
              ? {
                  ...prev,
                  item: {
                    ...prev.item,
                    name: `Scanned Item (${raw})`,
                  },
                }
              : null
          )
        }
      })
      .catch((e) => {
        const msg = e?.message || ''
        setDetectedError(msg || null)
        if (msg) addToast({ title: msg, variant: 'destructive' })
      })
      .finally(() => {
        setDetectedLoading(false)
      })
  }

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((t) => t.stop())
      videoRef.current.srcObject = null
      try { videoRef.current.pause() } catch {}
    }
  }

  const stopScanner = () => {
    setScanning(false)
    // Stop BarcodeDetector loop
    if (detectorStopRef.current) {
      detectorStopRef.current()
      detectorStopRef.current = null
    }
    // Stop ZXing controls
    if (controlsRef.current && typeof controlsRef.current.stop === 'function') {
      try { controlsRef.current.stop() } catch {}
      controlsRef.current = null
    }
    stopStream()
  }

  const startScanner = async () => {
    if (startingRef.current || scanning) return
    startingRef.current = true
    setScanError(null)
    try {
      const supportsGUM = typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      if (!supportsGUM) {
        setScanning(false)
        throw new Error('Camera API not available in this context (requires HTTPS/secure context and browser support).')
      }
      const hasDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window
      if (hasDetector) {
        // @ts-ignore
        const Detector = (window as any).BarcodeDetector
        // Prefer back camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!videoRef.current) throw new Error('Video element missing')
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setScanning(true)
        const detector = new Detector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
        })
        let stopped = false
        detectorStopRef.current = () => { stopped = true }
        const loop = async () => {
          if (stopped || !videoRef.current) return
          try {
            const results = await detector.detect(videoRef.current)
            if (results && results.length > 0) {
              const val = results[0].rawValue
              if (val) onDetected(String(val))
            }
          } catch {}
          if (!stopped) requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
      } else {
        // Try ZXing dynamically
        const zxing = await import('@zxing/browser').catch(() => null as any)
        if (!zxing || !zxing.BrowserMultiFormatReader) {
          throw new Error('Barcode scanning is not supported in this browser.')
        }
        const reader = new zxing.BrowserMultiFormatReader()
        controlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current!,
          (result: any, err: any) => {
            if (result) onDetected(result.getText())
          }
        )
        setScanning(true)
      }
    } catch (e: any) {
      const msg = e?.message || ''
      setScanError(msg || null)
      setScanning(false)
      stopScanner()
    } finally {
      startingRef.current = false
    }
  }

  // Setup viewport listener (once)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 639px)')
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mql.matches)
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
    } else {
      // @ts-ignore - Safari
      mql.addListener(onChange)
    }
    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', onChange)
      } else {
        // @ts-ignore - Safari
        mql.removeListener(onChange)
      }
    }
  }, [])

  // Stop camera scanning and focus input when switching to desktop
  React.useEffect(() => {
    if (!isMobile) {
      setWantScanning(false)
      stopScanner()
      setTimeout(() => hardwareInputRef.current?.focus(), 0)
    }
  }, [isMobile])

  // Keep camera lifecycle healthy on visibility changes and unmount
  React.useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopScanner()
      } else if (wantScanning && isMobile) {
        startScanner()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', stopScanner)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', stopScanner)
      stopScanner()
    }
  }, [wantScanning, isMobile])

  // Respond to mode changes: ensure scanner is stopped in quick mode, and focus hardware input on items mode (desktop)
  React.useEffect(() => {
    if (mode === 'quick') {
      setWantScanning(false)
      stopScanner()
    } else if (mode === 'items' && !isMobile) {
      setTimeout(() => hardwareInputRef.current?.focus(), 0)
    }
  }, [mode, isMobile])

  // (Removed resetForm and addToBill)

  const incQty = (id: string) => {
    setBillItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        if (typeof it.stock === 'number' && it.quantity + 1 > it.stock) {
          addToast({ variant: 'destructive', title: 'Out of stock', description: `Only ${it.stock} in stock` })
          return it
        }
        return { ...it, quantity: it.quantity + 1 }
      })
    )
  }

  const decQty = (id: string) => {
    setBillItems((prev) => {
      const updated = prev
        .map((it) => (it.id === id ? { ...it, quantity: it.quantity - 1 } : it))
        .filter((it) => it.quantity > 0)
      return updated
    })
  }

  const removeItem = (id: string) => setBillItems((prev) => prev.filter((it) => it.id !== id))

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen overflow-x-hidden">
      {/* Sticky Top Bar within the page */}
      <div
        className="sticky top-0 z-30 bg-background border-b"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-12 flex items-center justify-between px-1 sm:px-2">
          <span className="text-lg font-bold tracking-tight">LOOMO</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Billing Info removed */}

      {/* Scanner */}
      {mode === 'items' && (<Card>
        <CardHeader>
          <CardTitle>Barcode Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isMobile ? (
            <>
              <div className="w-full h-48 sm:h-60 rounded-md bg-black overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              </div>
              {scanError && (
                <p className="text-sm text-red-500">{scanError}</p>
              )}
              <div className="flex items-center gap-3">
                {!scanning ? (
                  <Button type="button" onClick={() => { setWantScanning(true); ensureAudio(); startScanner() }} className="flex-1">
                    Start Scanning
                  </Button>
                ) : (
                  <Button type="button" variant="destructive" onClick={() => { setWantScanning(false); stopScanner() }} className="flex-1">
                    Stop Scanning
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="hardware-code">Scan with hardware barcode scanner</Label>
                <Input
                  id="hardware-code"
                  ref={hardwareInputRef}
                  value={hardwareCode}
                  onChange={(e) => setHardwareCode(e.target.value)}
                  placeholder="Focus here and scan; press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = hardwareCode.trim()
                      if (val) {
                        ensureAudio()
                        onDetected(val)
                        setHardwareCode('')
                        setTimeout(() => hardwareInputRef.current?.focus(), 0)
                      }
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Camera scanning is disabled on desktop. Use a USB/Bluetooth barcode scanner or enter codes manually.
                </p>
              </div>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Status: {isMobile ? (scanning ? 'Scanning… point camera at a barcode' : 'Idle') : 'Hardware scanner ready — focus the input and scan (press Enter)'}
          </p>
        </CardContent>
      </Card>)}

      <div className="flex flex-col gap-4 min-w-0 overflow-x-hidden">
        {/* Bill View */}

        {/* Quick Billing (no items) */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Quick Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              {/* Summary */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Label htmlFor="manual-subtotal" className="text-muted-foreground">Sub Total</Label>
                  <Input
                    id="manual-subtotal"
                    type="number"
                    inputMode="decimal"
                    className="max-w-[150px]"
                    value={manualSubtotal}
                    onChange={(e) => setManualSubtotal(e.target.value)}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Label htmlFor="manual-discount" className="text-muted-foreground">Discount</Label>
                  <Input
                    id="manual-discount"
                    type="number"
                    inputMode="decimal"
                    className="max-w-[150px]"
                    value={manualDiscount}
                    onChange={(e) => setManualDiscount(e.target.value)}
                    min={0}
                    max={manualSubtotalNum}
                    step="0.01"
                  />
                </div>
                {manualDiscountTooHigh && (
                  <p className="text-xs text-red-500">Discount cannot exceed subtotal</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-xl">{formatINR(manualTotal)}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Customer Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                  {phoneError && (
                    <p className="text-sm text-red-500">{phoneError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-name">Customer Name (optional)</Label>
                  <Input
                    id="cust-name"
                    placeholder="Enter name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth (optional)</Label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      value={customerDob}
                      onChange={(e) => setCustomerDob(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" disabled={!phoneValid} className="flex-1">
                  <Bot className="h-4 w-4 mr-2" /> WhatsApp
                </Button>
                <Button type="button" variant="outline" disabled={!phoneValid} className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" /> SMS
                </Button>
              </div>
              {createError && <p className="text-sm text-red-500">{createError}</p>}
              <Button type="button" size="lg" disabled={!canFinalizeQuick} className="w-full" onClick={handleGenerateQuickBill}>
                {creatingOrder ? 'Generating…' : 'Generate Bill'}
              </Button>
            </CardContent>
          </Card>

        {/* Items flow */}
        {mode === 'items' && (
        <div className="flex flex-col gap-4 min-w-0 overflow-x-hidden">
          {/* Current Bill */}
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Current Bill</CardTitle>
            </CardHeader>
            <CardContent>
              {billItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Scan an item to start a bill</p>
              ) : (
                <div className="max-h-[40vh] overflow-y-auto overflow-x-hidden">
                  {/* Mobile stacked list */}
                  <div className="sm:hidden divide-y">
                    {billItems.map((item) => (
                      <div key={item.id} className="py-2">
                        <div className="font-medium leading-tight break-words">{item.name}</div>
                        <div className="text-xs text-muted-foreground">@ {formatINR(item.price)} each</div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button type="button" size="sm" variant="ghost" onClick={() => decQty(item.id)} aria-label="Decrease">
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => incQty(item.id)} aria-label="Increase">
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="font-medium tabular-nums">{formatINR(item.price * item.quantity)}</div>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(item.id)} aria-label="Remove">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop/tablet table */}
                  <div className="hidden sm:block">
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-2">Item</th>
                          <th className="py-2 pr-2 w-32">Qty</th>
                          <th className="py-2 pr-2 w-24 text-right">Total</th>
                          <th className="py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {billItems.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-2 pr-2 align-top min-w-0">
                              <div className="font-medium leading-tight break-words">{item.name}</div>
                              <div className="text-xs text-muted-foreground">@ {formatINR(item.price)} each</div>
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <div className="flex items-center gap-2">
                                <Button type="button" size="sm" variant="ghost" onClick={() => decQty(item.id)} aria-label="Decrease">
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button type="button" size="sm" variant="ghost" onClick={() => incQty(item.id)} aria-label="Increase">
                                  <PlusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className="py-2 pr-2 text-right align-middle font-medium">
                              {formatINR(item.price * item.quantity)}
                            </td>
                            <td className="py-2 align-middle">
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(item.id)} aria-label="Remove">
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Finalize Sale */}
          {billItems.length > 0 && (
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Finalize Sale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <Label htmlFor="discount" className="text-muted-foreground">Discount</Label>
                    <Input
                      id="discount"
                      type="number"
                      inputMode="decimal"
                      className="max-w-[150px]"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      min={0}
                      max={subtotal}
                      step="0.01"
                    />
                  </div>
                  {discountTooHigh && (
                    <p className="text-xs text-red-500">Discount cannot exceed subtotal</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-xl">{formatINR(total)}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">Customer Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter phone number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                    {phoneError && (
                      <p className="text-sm text-red-500">{phoneError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cust-name">Customer Name (optional)</Label>
                    <Input
                      id="cust-name"
                      placeholder="Enter name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth (optional)</Label>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dob"
                        type="date"
                        value={customerDob}
                        onChange={(e) => setCustomerDob(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" disabled={!phoneValid} className="flex-1">
                    <Bot className="h-4 w-4 mr-2" /> WhatsApp
                  </Button>
                  <Button type="button" variant="outline" disabled={!phoneValid} className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" /> SMS
                  </Button>
                </div>
                {createError && <p className="text-sm text-red-500">{createError}</p>}
                <Button type="button" size="lg" disabled={!canFinalizeItems} className="w-full" onClick={handleGenerateBillItems}>
                  {creatingOrder ? 'Generating…' : 'Generate Bill'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </div>

      {/* Detected popup */}
      {mode === 'items' && detectedInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-sm bg-background shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Barcode Detected</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 min-w-0">
              <div className="text-sm">
                <div className="text-muted-foreground">Code</div>
                <div className="font-mono break-all">{detectedInfo.code}</div>
              </div>
              {detectedLoading ? (
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Item</div>
                    <Skeleton className="mt-1 h-4 w-40" />
                    <div className="mt-2 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm">
                    <div className="text-muted-foreground">Item</div>
                    <div className="font-medium">{detectedInfo.item.name}</div>
                    <div className="text-xs text-muted-foreground">Qty: {detectedInfo.item.quantity}</div>
                    {detectedStock !== null && (
                      <div className="text-xs text-muted-foreground">In stock: {detectedStock}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detected-price">Price</Label>
                    <Input
                      id="detected-price"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={detectedPrice}
                      onChange={(e) => setDetectedPrice(e.target.value)}
                    />
                  </div>
                  {detectedError && <p className="text-sm text-red-500">{detectedError}</p>}
                </>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 w-full min-w-0">
                <Button
                  className="w-full min-w-0 whitespace-normal text-center"
                  disabled={
                    !detectedPrice.trim() ||
                    detectedLoading ||
                    !!detectedError ||
                    (detectedStock !== null && detectedStock <= 0)
                  }
                  onClick={() => {
                    if (!detectedInfo) return
                    const p = Math.max(0, parseFloat(detectedPrice || '0') || 0)
                    const base = detectedInfo.item
                    const newItem: BillItem = {
                      ...base,
                      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      price: p,
                      productId: detectedProductId ?? undefined,
                      stock: detectedStock ?? undefined,
                    }
                    setBillItems((prev) => {
                      const idx = prev.findIndex((it) =>
                        (newItem.productId && it.productId === newItem.productId && it.price === newItem.price) ||
                        (!newItem.productId && it.name === newItem.name && it.price === newItem.price && it.category === newItem.category)
                      )
                      if (idx !== -1) {
                        const copy = [...prev]
                        const existing = copy[idx]
                        const max = typeof (existing.stock ?? newItem.stock) === 'number' ? (existing.stock ?? newItem.stock)! : Infinity
                        const desired = existing.quantity + newItem.quantity
                        if (desired > max) {
                          copy[idx] = { ...existing, quantity: max }
                          addToast({ variant: 'destructive', title: 'Stock limit reached', description: `Only ${max} available` })
                        } else {
                          copy[idx] = { ...existing, quantity: desired }
                        }
                        return copy
                      }
                      return [newItem, ...prev]
                    })
                    setDetectedInfo(null)
                  }}
                >
                  Add to Bill
                </Button>
                <Button
                  className="w-full min-w-0 whitespace-normal text-center"
                  variant="outline"
                  disabled={
                    !detectedPrice.trim() ||
                    detectedLoading ||
                    !!detectedError ||
                    (detectedStock !== null && detectedStock <= 0)
                  }
                  onClick={() => {
                    if (!detectedInfo) return
                    const p = Math.max(0, parseFloat(detectedPrice || '0') || 0)
                    const base = detectedInfo.item
                    const newItem: BillItem = {
                      ...base,
                      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      price: p,
                      productId: detectedProductId ?? undefined,
                      stock: detectedStock ?? undefined,
                    }
                    setBillItems((prev) => {
                      const idx = prev.findIndex((it) =>
                        (newItem.productId && it.productId === newItem.productId && it.price === newItem.price) ||
                        (!newItem.productId && it.name === newItem.name && it.price === newItem.price && it.category === newItem.category)
                      )
                      if (idx !== -1) {
                        const copy = [...prev]
                        const existing = copy[idx]
                        const max = typeof (existing.stock ?? newItem.stock) === 'number' ? (existing.stock ?? newItem.stock)! : Infinity
                        const desired = existing.quantity + newItem.quantity
                        if (desired > max) {
                          copy[idx] = { ...existing, quantity: max }
                          addToast({ variant: 'destructive', title: 'Stock limit reached', description: `Only ${max} available` })
                        } else {
                          copy[idx] = { ...existing, quantity: desired }
                        }
                        return copy
                      }
                      return [newItem, ...prev]
                    })
                    setDetectedInfo(null)
                    if (isMobile) {
                      setWantScanning(true)
                      ensureAudio()
                      startScanner()
                    } else {
                      setTimeout(() => hardwareInputRef.current?.focus(), 0)
                    }
                  }}
                >
                  Add & Scan Next
                </Button>
                <Button
                  className="w-full min-w-0 whitespace-normal text-center"
                  variant="destructive"
                  onClick={() => {
                    setDetectedInfo(null)
                    if (isMobile) {
                      setWantScanning(true)
                      ensureAudio()
                      startScanner()
                    } else {
                      setTimeout(() => hardwareInputRef.current?.focus(), 0)
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
