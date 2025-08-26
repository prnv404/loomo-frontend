import { graphqlClient } from './api'

export type ScannedProduct = {
  id: string
  name: string
  price: number
  stock_quantity: number
  barcode?: string
}

const GQL_PRODUCT_BY_CODE = `
  query ($code: String!) {
    productByCode(code: $code) {
      name
      id
      price
      stock_quantity
      barcode
    }
  }
`

export async function productByCode(code: string): Promise<ScannedProduct | null> {
  const data = await graphqlClient.query<{ productByCode: any | null }>(GQL_PRODUCT_BY_CODE, { code })
  const p = data?.productByCode
  if (!p) return null
  return {
    id: String(p.id),
    name: p.name ?? '',
    price: Number(p.price) || 0,
    stock_quantity: Number(p.stock_quantity) || 0,
    barcode: p.barcode ?? undefined,
  }
}

export type CreateOrderItemInput = {
  product_id: number
  price: number
  quantity: number
}

export type CreateOrderInput = {
  customer_name?: string
  customer_phone: string
  dob?: string
  order_items: CreateOrderItemInput[]
  discount?: number
  sub_total: number
}

export type CreateOrderResult = {
  invoice_number: string
  total: number
  sub_total: number
  status: string
  tax: number
  discount: number
}

const GQL_CREATE_ORDER = `
  mutation ($createOrderInput: CreateOrderInput!) {
    createOrder(createOrderInput: $createOrderInput) {
      invoice_number
      total
      sub_total
      status
      tax
      discount
    }
  }
`

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const data = await graphqlClient.mutate<{ createOrder: CreateOrderResult }>(GQL_CREATE_ORDER, { createOrderInput: input })
  // @ts-ignore - GraphQL client returns typed object
  return data?.createOrder as CreateOrderResult
}

const billingService = { productByCode, createOrder }
export default billingService
