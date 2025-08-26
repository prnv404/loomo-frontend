import { graphqlClient } from './api'

export type StoreOrderStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed'

export type StoreOrder = {
  id: string
  invoice: string
  total: number
  date: string // ISO string
  status: StoreOrderStatus
  customer?: { id: string; name?: string; phone?: string }
  items?: Array<{ productId: string; productName: string }>
  user?: { id: string; name?: string }
}

const GQL_ORDERS = `
  query Orders {
    orders {
      id
      invoice_number
      sub_total
      createdAt
      status
      customer { id name phone }
      order_items { product { id name } }
      user { id name }
    }
  }
`

function mapStatus(s?: string | null): StoreOrderStatus {
  const t = (s || '').toLowerCase()
  if (t.startsWith('pending')) return 'Pending'
  if (t.startsWith('accept')) return 'Accepted'
  if (t.startsWith('declin') || t.startsWith('reject')) return 'Declined'
  return 'Completed'
}

export const ordersService = {
  async listStore(): Promise<StoreOrder[]> {
    try {
      const data = await graphqlClient.query<{ orders: any[] }>(GQL_ORDERS)
      const arr = (data?.orders ?? []).map((o) => ({
        id: String(o.id),
        invoice: o.invoice_number ?? '',
        total: Number(o.sub_total) || 0,
        date: o.createdAt ?? new Date().toISOString(),
        status: mapStatus(o.status),
        customer: o.customer
          ? { id: String(o.customer.id), name: o.customer.name ?? undefined, phone: o.customer.phone ?? undefined }
          : undefined,
        items: Array.isArray(o.order_items)
          ? o.order_items.map((it: any) => ({
              productId: it?.product?.id != null ? String(it.product.id) : '',
              productName: it?.product?.name ?? '',
            }))
          : [],
        user: o.user ? { id: String(o.user.id), name: o.user.name ?? undefined } : undefined,
      }))
      return arr
    } catch (e) {
      // Fallback: empty list (could add local sample if desired)
      return []
    }
  },
}

export default ordersService
