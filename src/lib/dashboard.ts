import { graphqlClient, safeQuery, type ApiResponse } from './api'

export type RevenuePoint = { month: string; revenue: number }
export type Summary = {
  monthlyNetProfit: number
  todaySales: number
  totalOrders: number
  totalRevenue: number
  todaySalesChangeText: string
  totalRevenueChangeText: string
  monthlyNetProfitChangeText: string
  ordersTodayText: string
}
export type CategorySales = {
  categoryId: number
  categoryName: string
  totalAmount: number
  totalQuantity: number
}

export type DashboardData = {
  revenueLast6Months: RevenuePoint[]
  summary: Summary
  salesByCategory: CategorySales[]
}

const GQL_DASHBOARD = `
  query Dashboard {
    dashboard {
      revenueLast6Months { month revenue }
      summary {
        monthlyNetProfit
        todaySales
        totalRevenue
        totalOrders
        todaySalesChangeText
        totalRevenueChangeText
        monthlyNetProfitChangeText
        ordersTodayText
      }
      salesByCategory { categoryId categoryName totalAmount totalQuantity }
    }
  }
`

function mapDashboard(d: any): DashboardData {
  const revenueLast6Months: RevenuePoint[] = Array.isArray(d?.revenueLast6Months)
    ? d.revenueLast6Months.map((p: any) => ({
        month: String(p?.month ?? ''),
        revenue: Number(p?.revenue) || 0,
      }))
    : []
  const summary: Summary = {
    monthlyNetProfit: Number(d?.summary?.monthlyNetProfit) || 0,
    todaySales: Number(d?.summary?.todaySales) || 0,
    totalOrders: Number(d?.summary?.totalOrders) || 0,
    totalRevenue: Number(d?.summary?.totalRevenue) || 0,
    todaySalesChangeText: String(d?.summary?.todaySalesChangeText ?? ''),
    totalRevenueChangeText: String(d?.summary?.totalRevenueChangeText ?? ''),
    monthlyNetProfitChangeText: String(d?.summary?.monthlyNetProfitChangeText ?? ''),
    ordersTodayText: String(d?.summary?.ordersTodayText ?? ''),
  }
  const salesByCategory: CategorySales[] = Array.isArray(d?.salesByCategory)
    ? d.salesByCategory.map((c: any) => ({
        categoryId: Number(c?.categoryId) || 0,
        categoryName: String(c?.categoryName ?? ''),
        totalAmount: Number(c?.totalAmount) || 0,
        totalQuantity: Number(c?.totalQuantity) || 0,
      }))
    : []
  return { revenueLast6Months, summary, salesByCategory }
}

export async function get(): Promise<DashboardData> {
  const data = await graphqlClient.query<{ dashboard: any }>(GQL_DASHBOARD)
  return mapDashboard(data?.dashboard ?? {})
}

export async function getSafe(): Promise<ApiResponse<DashboardData>> {
  const res = await safeQuery<{ dashboard: any }>(GQL_DASHBOARD)
  if (!res.data) {
    return { data: null, errors: res.errors ?? [{ message: 'Unknown error', code: 'UNKNOWN', details: '', path: [] }] }
  }
  return { data: mapDashboard(res.data.dashboard ?? {}), errors: null }
}

const dashboardService = { get, getSafe }
export default dashboardService
