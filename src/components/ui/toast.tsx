'use client'

import * as React from 'react'

export type ToastOptions = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  durationMs?: number
}

export type ToastContextValue = {
  addToast: (opts: ToastOptions) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<ToastOptions & { id: string }>>([])

  const addToast = React.useCallback((opts: ToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const duration = Math.max(1500, Math.min(8000, opts.durationMs ?? 3500))
    setToasts((prev) => [...prev, { ...opts, id }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'pointer-events-auto rounded-md border p-3 shadow-lg backdrop-blur bg-background/95 text-foreground ' +
              (t.variant === 'destructive' ? ' border-red-500/60' : ' border-border')
            }
            role="status"
            aria-live="polite"
          >
            {t.title && <div className="font-medium leading-tight">{t.title}</div>}
            {t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
