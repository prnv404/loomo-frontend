"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ordersService from "@/lib/orders"
import { formatApiError } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

type Status = "Pending" | "Accepted" | "Declined" | "Completed"

type Order = {
  id: string
  invoice: string
  total: number
  date: string // ISO string
  status: Status
  customerName?: string
}

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value)

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

export default function OrdersPage() {
  const [tab, setTab] = React.useState<"store" | "online">("store")

  const [storeOrders, setStoreOrders] = React.useState<Order[]>([])
  const [loadingStore, setLoadingStore] = React.useState(true)
  const [errorStore, setErrorStore] = React.useState<string | null>(null)
  const { addToast } = useToast()

  React.useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await ordersService.listStoreSafe()
        if (!active) return
        if (res.errors) {
          const msg = formatApiError(res.errors, "Failed to load orders")
          setErrorStore(msg)
          addToast({ title: "Failed to load orders", description: msg, variant: "destructive" })
          setStoreOrders([])
        } else {
          const mapped: Order[] = (res.data ?? []).map((o) => ({
            id: o.id,
            invoice: o.invoice,
            total: o.total,
            date: o.date,
            status: o.status,
          }))
          setStoreOrders(mapped)
        }
      } catch {
        // keep empty
      } finally {
        if (active) setLoadingStore(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const [onlineOrders, setOnlineOrders] = React.useState<Order[]>([
    { id: "o1", invoice: "INV-2003", total: 1599, date: new Date().toISOString(), status: "Pending", customerName: "Rahul" },
    { id: "o2", invoice: "INV-2002", total: 2199, date: new Date(Date.now() - 3600000).toISOString(), status: "Pending", customerName: "Priya" },
    { id: "o3", invoice: "INV-2001", total: 4599, date: new Date(Date.now() - 4 * 3600000).toISOString(), status: "Accepted", customerName: "Amit" },
  ])

  const updateOnlineStatus = (id: string, status: Exclude<Status, "Completed">) => {
    setOnlineOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }

  const renderStatus = (status: Status) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>
      case "Accepted":
        return <Badge>Accepted</Badge>
      case "Declined":
        return <Badge variant="destructive">Declined</Badge>
      case "Completed":
        return <Badge variant="outline">Completed</Badge>
    }
  }

  const List = ({ data, type, loading = false, error }: { data: Order[]; type: "store" | "online"; loading?: boolean; error?: string | null }) => (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{type === "store" ? "Store Orders" : "Online Orders"}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        {error && (
          <p className="text-sm text-red-500 mb-2">{error}</p>
        )}
        {data.length === 0 ? (
          loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <p className="text-sm text-muted-foreground">No orders found.</p>
          )
        ) : (
          <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto scroll-bounce pr-1">
            <div className="divide-y">
              {data.map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{o.invoice}</div>
                    {type === "store" && (
                      <div className="text-xs text-muted-foreground">{formatDate(o.date)}</div>
                    )}
                  </div>
                  <div className="w-24 text-right font-medium tabular-nums">{formatINR(o.total)}</div>
                  {type === "store" && (
                    <div className="w-28 flex justify-end">{renderStatus(o.status)}</div>
                  )}
                  {type === "online" && (
                    <div className="flex flex-col items-end gap-1 pl-2 min-w-[12rem]">
                      <div className="text-xs text-muted-foreground text-right leading-tight">
                        <div className="text-foreground font-medium">{o.customerName ?? "Customer"}</div>
                        <div>{formatDate(o.date)}</div>
                      </div>
                      <div className="flex justify-end">{renderStatus(o.status)}</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={o.status !== "Pending"}
                          onClick={() => updateOnlineStatus(o.id, "Accepted")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={o.status !== "Pending"}
                          onClick={() => updateOnlineStatus(o.id, "Declined")}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4 flex flex-col gap-4 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/icon.svg" alt="Logo" width={28} height={28} />
          <h1 className="text-xl font-semibold">Orders</h1>
        </div>
      </div>

      {/* Tabs / Segmented control */}
      <div className="flex w-full max-w-sm rounded-lg overflow-hidden border">
        <Button
          className={`flex-1 rounded-none ${
            tab === "store" ? "bg-black text-white dark:bg-accent dark:text-accent-foreground" : "bg-background"
          }`}
          variant={tab === "store" ? "default" : "secondary"}
          onClick={() => setTab("store")}
        >
          Store Orders
        </Button>
        <Button
          className={`flex-1 rounded-none ${
            tab === "online" ? "bg-black text-white dark:bg-accent dark:text-accent-foreground" : "bg-background"
          }`}
          variant={tab === "online" ? "default" : "secondary"}
          onClick={() => setTab("online")}
        >
          Online Orders
        </Button>
      </div>

      {tab === "store" ? <List data={storeOrders} type="store" loading={loadingStore} error={errorStore} /> : <List data={onlineOrders} type="online" />}
    </div>
  )
}
