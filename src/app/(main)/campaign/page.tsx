"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Megaphone } from "lucide-react"
import Link from "next/link"
import ThemeSwitcher from "@/components/theme-switcher"
import ProfileMenu from "@/components/profile-menu"

interface Customer {
  id: string
  name: string
  phone: string
  dob: string // ISO date
}

export default function MorePage() {
  // Mock customers
  const [customers] = React.useState<Customer[]>([
    { id: "C001", name: "Rahul", phone: "9876543210", dob: "1992-05-14" },
    { id: "C002", name: "Priya", phone: "9876501234", dob: "1995-09-01" },
    { id: "C003", name: "Amit", phone: "9876512345", dob: "1989-12-07" },
  ])

  // Table UX: search + pagination (scales to 500+ rows)
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.dob.includes(q)
    )
  }, [query, customers])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  React.useEffect(() => { if (page > totalPages) setPage(1) }, [totalPages])
  React.useEffect(() => { setPage(1) }, [query, pageSize])
  const start = (page - 1) * pageSize
  const end = Math.min(start + pageSize, filtered.length)
  const pageItems = filtered.slice(start, end)

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen overflow-x-hidden">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-background border-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-12 flex items-center justify-between px-1 sm:px-2">
          <span className="text-lg font-bold tracking-tight">LOOMO</span>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <ProfileMenu />
          </div>
        </div>
      </div>

      <div className="container mx-auto flex flex-col gap-4 min-w-0">

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Button asChild size="lg" className="h-20 rounded-xl flex flex-col items-center justify-center gap-2" variant="outline">
            <Link href="/campaign/new">
              <Megaphone className="h-6 w-6" />
              <span className="font-semibold">Campaign</span>
            </Link>
          </Button>
        </div>

        {/* Customers section below */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers found.</p>
          ) : (
            <>
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Input
                    placeholder="Search by name, phone, ID, DOB"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="max-w-sm"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rows:</span>
                    <select
                      className="h-9 border rounded-md bg-background px-2"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Scrollable table with sticky header */}
                <div className="max-h-[60vh] overflow-auto scroll-bounce">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-background sticky top-0 z-10">
                        <th className="py-2 pr-2 text-left w-24">ID</th>
                        <th className="py-2 pr-2 text-left">Name</th>
                        <th className="py-2 pr-2 text-left w-40">Phone</th>
                        <th className="py-2 pr-2 text-left w-40">DOB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((c) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2 pr-2 align-middle">{c.id}</td>
                          <td className="py-2 pr-2 align-middle">{c.name}</td>
                          <td className="py-2 pr-2 align-middle">{c.phone}</td>
                          <td className="py-2 pr-2 align-middle">{c.dob}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-muted-foreground">
                    Showing {filtered.length ? start + 1 : 0}-{end} of {filtered.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Prev
                    </Button>
                    <span className="text-xs">Page {page} / {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
            </>
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
