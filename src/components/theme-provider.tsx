'use client'

import React from 'react'

export type Theme = 'light' | 'dark'

type ThemeProviderContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = React.createContext<ThemeProviderContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'loomo-theme',
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)

  // Pre-hydration inline script to avoid FOUC by setting the class on <html> ASAP
  const inlineScript = `(() => { try {\n  var key = '${storageKey}';\n  var stored = localStorage.getItem(key);\n  var fallback = '${defaultTheme}';\n  var t = (stored === 'light' || stored === 'dark') ? stored : fallback;\n  var root = document.documentElement;\n  root.classList.remove(t === 'light' ? 'dark' : 'light');\n  root.classList.add(t);\n  root.style.colorScheme = t;\n} catch (_) {} })();`

  const applyTheme = (t: Theme) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.remove(t === 'light' ? 'dark' : 'light')
    root.classList.add(t)
    root.style.colorScheme = t
  }

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      const initial: Theme = stored === 'light' || stored === 'dark' ? stored : defaultTheme
      setThemeState(initial)
      applyTheme(initial)
    } catch (_) {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTheme, storageKey])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(storageKey, t)
    } catch (_) {
      // no-op
    }
    applyTheme(t)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {/* This inline script executes before React hydrates to prevent FOUC */}
      <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const ctx = React.useContext(ThemeProviderContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
