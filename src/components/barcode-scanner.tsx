'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

// A reusable barcode scanner component with BarcodeDetector (when available)
// and @zxing/browser fallback. Emits detected codes via onDetected.
// Includes simple start/stop controls.
//
// Props:
// - onDetected: callback with the detected code string
// - autoStart?: whether to start scanning immediately on mount (default false)
// - pauseOnDetected?: whether to stop scanning after a successful detection (default true)
// - heightClass?: Tailwind height classes for the video container (default 'h-48 sm:h-60')
// - className?: extra class names
// - showControls?: show start/stop buttons (default true)
export default function BarcodeScanner({
  onDetected,
  autoStart = false,
  pauseOnDetected = true,
  heightClass = 'h-48 sm:h-60',
  className = '',
  showControls = true,
}: {
  onDetected: (code: string) => void
  autoStart?: boolean
  pauseOnDetected?: boolean
  heightClass?: string
  className?: string
  showControls?: boolean
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const controlsRef = React.useRef<any>(null) // @zxing controls
  const detectorStopRef = React.useRef<null | (() => void)>(null)
  const [scanning, setScanning] = React.useState(false)
  const [scanError, setScanError] = React.useState<string | null>(null)
  const startingRef = React.useRef(false)
  const lastScanRef = React.useRef<{ value: string; at: number } | null>(null)

  // Audio + haptic feedback
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
      osc.type = 'square'
      osc.frequency.value = 1100
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.24)
      osc.onended = () => {
        try {
          osc.disconnect()
          gain.disconnect()
        } catch {}
      }
    } catch {}
  }
  const haptic = () => {
    try {
      if (typeof navigator !== 'undefined' && typeof (navigator as any).vibrate === 'function') {
        ;(navigator as any).vibrate(25)
      }
    } catch {}
  }

  const handleDetected = (raw: string) => {
    const now = Date.now()
    if (lastScanRef.current && lastScanRef.current.value === raw && now - lastScanRef.current.at < 1200) {
      return // ignore rapid duplicate
    }
    lastScanRef.current = { value: raw, at: now }
    beep()
    haptic()
    onDetected(raw)
    if (pauseOnDetected) stopScanner()
  }

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((t) => t.stop())
      videoRef.current.srcObject = null
      try {
        videoRef.current.pause()
      } catch {}
    }
  }

  const stopScanner = () => {
    setScanning(false)
    if (detectorStopRef.current) {
      detectorStopRef.current()
      detectorStopRef.current = null
    }
    if (controlsRef.current && typeof controlsRef.current.stop === 'function') {
      try {
        controlsRef.current.stop()
      } catch {}
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
        throw new Error('Camera API not available (requires HTTPS/secure context).')
      }
      const hasDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window
      if (hasDetector) {
        // @ts-ignore
        const Detector = (window as any).BarcodeDetector
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
        detectorStopRef.current = () => {
          stopped = true
        }
        const loop = async () => {
          if (stopped || !videoRef.current) return
          try {
            const results = await detector.detect(videoRef.current)
            if (results && results.length > 0) {
              const val = results[0].rawValue
              if (val) handleDetected(String(val))
            }
          } catch {}
          if (!stopped) requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
      } else {
        const zxing = await import('@zxing/browser').catch(() => null as any)
        if (!zxing || !zxing.BrowserMultiFormatReader) {
          throw new Error('Barcode scanning not supported in this browser.')
        }
        const reader = new zxing.BrowserMultiFormatReader()
        controlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current!,
          (result: any) => {
            if (result) handleDetected(result.getText())
          }
        )
        setScanning(true)
      }
      await ensureAudio()
    } catch (e: any) {
      setScanError(e?.message || 'Failed to start scanner')
      setScanning(false)
      stopScanner()
    } finally {
      startingRef.current = false
    }
  }

  // Cleanup on unmount or page hide
  React.useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopScanner()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', stopScanner)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', stopScanner)
      stopScanner()
    }
  }, [])

  React.useEffect(() => {
    if (autoStart) startScanner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  return (
    <div className={className}>
      <div className={`w-full ${heightClass} rounded-md bg-black overflow-hidden`}>
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      </div>
      {scanError && <p className="text-sm text-red-500 mt-2">{scanError}</p>}
      {showControls && (
        <div className="flex items-center gap-3 mt-3">
          {!scanning ? (
            <Button type="button" onClick={startScanner} className="flex-1">
              Start Scanning
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={stopScanner} className="flex-1">
              Stop Scanning
            </Button>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-1">Status: {scanning ? 'Scanning… point camera at a barcode' : 'Idle'}</p>
    </div>
  )
}
