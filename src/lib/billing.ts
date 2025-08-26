import { graphqlClient, safeQuery, safeMutate, type ApiResponse } from './api'

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

export async function productByCodeSafe(code: string): Promise<ApiResponse<ScannedProduct | null>> {
  const res = await safeQuery<{ productByCode: any | null }>(GQL_PRODUCT_BY_CODE, { code })
  if (!res.data) {
    // No transport/GraphQL-level data; pass through errors or none
    return { data: null, errors: res.errors ?? null }
  }
  const p = res.data.productByCode
  if (!p) {
    // Not found: this is not an error; return data: null with no errors
    return { data: null, errors: null }
  }
  const mapped: ScannedProduct = {
    id: String(p.id),
    name: p.name ?? '',
    price: Number(p.price) || 0,
    stock_quantity: Number(p.stock_quantity) || 0,
    barcode: p.barcode ?? undefined,
  }
  return { data: mapped, errors: null }
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

export async function createOrderSafe(input: CreateOrderInput): Promise<ApiResponse<CreateOrderResult>> {
  const res = await safeMutate<{ createOrder: CreateOrderResult }>(GQL_CREATE_ORDER, { createOrderInput: input })
  if (!res.data) {
    return { data: null, errors: res.errors ?? null }
  }
  // @ts-ignore
  const payload = res.data.createOrder as CreateOrderResult
  return { data: payload, errors: null }
}

const billingService = { productByCode, productByCodeSafe, createOrder, createOrderSafe }
export default billingService
