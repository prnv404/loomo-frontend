"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

export default function ClientAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    // Do not gate the login route
    if (pathname === "/login") {
      setReady(true)
      return
    }
    // Only check on client
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
    if (!token) {
      // No token: redirect to login
      router.replace("/login")
      return
    }
    setReady(true)
  }, [pathname, router])

  if (pathname === "/login") return <>{children}</>
  if (!ready) return null
  return <>{children}</>
}
