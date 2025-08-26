"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import customersService, { type Customer } from "@/lib/customers"
import { formatApiError } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const { addToast } = useToast()

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await customersService.listSafe()
      if (res.errors) {
        const msg = formatApiError(res.errors, "")
        setError(msg || null)
        if (msg) addToast({ title: msg, variant: "destructive" })
        setCustomers([])
        return
      }
      setCustomers(res.data ?? [])
    } catch (e: any) {
      const msg = e?.message || ""
      setError(msg || null)
      if (msg) addToast({ title: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  React.useEffect(() => {
    let active = true
    ;(async () => {
      await load()
      if (!active) return
    })()
    return () => {
      active = false
    }
  }, [load])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.name ?? "", c.phone ?? "", c.dob ?? ""].some((v) => String(v).toLowerCase().includes(q))
    )
  }, [customers, search])

  return (
    <div className="container mx-auto p-4 flex flex-col gap-4 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Image src="/icon.svg" alt="Logo" width={28} height={28} />
          <h1 className="text-xl font-semibold truncate">Customers</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="min-w-0">
        <CardHeader className="gap-2">
          <CardTitle className="text-base">Customer List</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, phone, or DOB"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          {filtered.length === 0 ? (
            loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-2">
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-40 max-w-[60%]" />
                      <Skeleton className="h-3 w-32 max-w-[40%] mt-2" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No customers found.</p>
            )
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scroll-bounce pr-1">
              <div className="divide-y">
                {filtered.map((c, idx) => (
                  <div key={`${c.phone}-${idx}`} className="flex items-center justify-between gap-3 py-3 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.phone || "—"}</div>
                    </div>
                    <div className="w-40 text-right text-xs text-muted-foreground truncate">
                      {c.dob ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
