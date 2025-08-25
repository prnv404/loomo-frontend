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

// Mock data for the stats cards
const stats = {
  totalRevenue: 45231.89,
  revenueChange: "+20.1%",
  totalCustomers: 2350,
  customersChange: "+15.2%",
  salesToday: 1250.00,
  salesTodayChange: "+5.4% from yesterday",
  totalOrders: 1204,
  ordersToday: 42,
}

// Mock data for the revenue chart
const revenueOverTime = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
  { name: 'Jul', revenue: 7000 },
]

// Mock data for top categories
const topCategories = [
  { categoryName: 'Classic White Shirt', totalQuantity: 150, totalRevenue: 11250.00 },
  { categoryName: 'Slim-Fit Chinos', totalQuantity: 120, totalRevenue: 10800.00 },
  { categoryName: 'Leather Loafers', totalQuantity: 80, totalRevenue: 12000.00 },
]

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
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-500">{stats.revenueChange} from last month</p>
          </CardContent>
        </Card>

        {/* Total Orders Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.ordersToday} orders today</p>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">+{stats.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-green-500">{stats.customersChange} from last month</p>
          </CardContent>
        </Card>

        {/* Sales Today Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">+{stats.salesToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.salesTodayChange}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid (Chart and Categories) */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Revenue Overview Chart Card */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={280} className="sm:h-[350px]">
              <AreaChart data={revenueOverTime}>
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
    </div>
  )
}
