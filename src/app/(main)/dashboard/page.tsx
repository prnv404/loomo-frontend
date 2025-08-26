'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Package, Users, Activity, TrendingUp } from 'lucide-react'
import ThemeSwitcher from '@/components/theme-switcher'
import ProfileMenu from '@/components/profile-menu'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'
import dashboardService, { RevenuePoint, Summary, CategorySales } from '@/lib/dashboard'
import { formatApiError } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

// Helpers
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtMonth(ym: string) {
  const parts = ym.split('-')
  const m = Number(parts[1])
  return Number.isFinite(m) && m >= 1 && m <= 12 ? MONTHS[m - 1] : ym
}

function changeClass(text?: string) {
  const t = (text || '').trim()
  if (t.startsWith('-')) return 'text-red-500'
  if (t.startsWith('+')) return 'text-green-500'
  return 'text-muted-foreground'
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-2 shadow-md" style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))'
      }}>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold text-card-foreground">
              ₹{payload[0].value.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [revenue6, setRevenue6] = useState<RevenuePoint[]>([])
  const [categories, setCategories] = useState<CategorySales[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const res = await dashboardService.getSafe()
      if (!active) return
      if (res.errors) {
        setError(formatApiError(res.errors, ''))
        setSummary(null)
        setRevenue6([])
        setCategories([])
      } else if (res.data) {
        setSummary(res.data.summary)
        setRevenue6(res.data.revenueLast6Months)
        setCategories(res.data.salesByCategory)
        setError(null)
      }
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const revenueChartData = useMemo(
    () => revenue6.map((p) => ({ name: fmtMonth(p.month), revenue: p.revenue })),
    [revenue6]
  )
  const topCategories = useMemo(
    () =>
      categories.map((c) => ({
        categoryName: c.categoryName,
        totalQuantity: c.totalQuantity,
        totalRevenue: c.totalAmount,
      })),
    [categories]
  )

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen">
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
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">OUTFIT</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Here's a summary of your store's performance.</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Stats Cards Grid */}
      {loading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">₹{(summary?.totalRevenue ?? 0).toLocaleString()}</div>
              <p className={`text-xs ${changeClass(summary?.totalRevenueChangeText)}`}>
                {summary?.totalRevenueChangeText || '\u00A0'}
              </p>
            </CardContent>
          </Card>

          {/* Total Orders Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{(summary?.totalOrders ?? 0).toLocaleString()}</div>
              <p className={`text-xs ${changeClass(summary?.ordersTodayText)}`}>
                {summary?.ordersTodayText || '\u00A0'}
              </p>
            </CardContent>
          </Card>

          {/* Net Profit (Monthly) Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit (Monthly)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">₹{(summary?.monthlyNetProfit ?? 0).toLocaleString()}</div>
              <p className={`text-xs ${changeClass(summary?.monthlyNetProfitChangeText)}`}>
                {summary?.monthlyNetProfitChangeText || '\u00A0'}
              </p>
            </CardContent>
          </Card>

          {/* Sales Today Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">₹{(summary?.todaySales ?? 0).toLocaleString()}</div>
              <p className={`text-xs ${changeClass(summary?.todaySalesChangeText)}`}>
                {summary?.todaySalesChangeText || '\u00A0'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid (Chart and Categories) */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          {/* Revenue Skeleton */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="pl-2">
              <Skeleton className="h-[280px] sm:h-[350px] w-full" />
            </CardContent>
          </Card>
          {/* Categories Skeleton */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-60" />
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-1 min-w-0">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          {/* Revenue Overview Chart Card */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={280} className="sm:h-[350px]">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    className="sm:text-xs"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                    className="sm:text-xs"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    strokeWidth={2}
                    stroke="hsl(var(--primary))"
                    fill="url(#fillRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Categories Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Top Categories</CardTitle>
              <CardDescription className="text-sm">Your best-performing categories this month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {topCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-muted p-2 sm:p-3 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{category.categoryName}</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {category.totalQuantity} items sold
                    </p>
                  </div>
                  <div className="font-bold text-sm sm:text-lg flex-shrink-0">
                    ₹{category.totalRevenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
