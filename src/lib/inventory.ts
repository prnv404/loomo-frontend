import { graphqlClient } from './api'

export type Product = {
  id: string
  barcode?: string
  name: string
  category: string
  costPrice: number
  sellingPrice: number
  createdAt: string
  updatedAt: string
  // Optional extended attributes
  description?: string
  size?: string
  color?: string
  stockQuantity?: number
  offerType?: 'NONE' | 'PERCENTAGE' | 'FLAT'
  offerValue?: number
  images?: string[]
}

export type CreateProductInput = {
  barcode?: string
  name: string
  category: string
  costPrice: number
  sellingPrice: number
  // Optional extended attributes
  description?: string
  size?: string
  color?: string
  stockQuantity?: number
  offerType?: 'NONE' | 'PERCENTAGE' | 'FLAT'
  offerValue?: number
  images?: string[]
}

export type Category = {
  id: number
  name: string
}

export type UpdateProductInput = Partial<CreateProductInput>

export type ListParams = {
  search?: string
  category?: string
  sortBy?: 'name' | 'category' | 'createdAt' | 'updatedAt' | 'sellingPrice'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type ListResult = {
  items: Product[]
  total: number
}

const LS_KEY = 'loomo:inventory:products'

const nowIso = () => new Date().toISOString()

const loadLocal = (): Product[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

const saveLocal = (items: Product[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  } catch {}
}

const ensureSeed = () => {
  if (typeof window === 'undefined') return
  const current = loadLocal()
  if (current.length > 0) return
  const seed: Product[] = [
    {
      id: 'seed-1',
      barcode: '8901234567890',
      name: 'Classic White Shirt',
      category: 'Shirts',
      costPrice: 600,
      sellingPrice: 899,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'seed-2',
      barcode: '8901234567891',
      name: 'Slim-Fit Chinos',
      category: 'Pants',
      costPrice: 900,
      sellingPrice: 1299,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 'seed-3',
      barcode: '8901234567892',
      name: 'Leather Loafers',
      category: 'Shoes',
      costPrice: 1800,
      sellingPrice: 2499,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ]
  saveLocal(seed)
}

const toLocalList = (all: Product[], params: ListParams): ListResult => {
  const { search = '', category, sortBy = 'updatedAt', sortDir = 'desc', page = 1, pageSize = 50 } = params
  let filtered = all
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    filtered = filtered.filter((p) =>
      [p.name, p.category, p.barcode || ''].some((v) => String(v).toLowerCase().includes(q))
    )
  }
  if (category && category !== 'All') {
    filtered = filtered.filter((p) => p.category === category)
  }
  const dir = sortDir === 'asc' ? 1 : -1
  filtered = filtered.sort((a, b) => {
    const get = (x: Product) => (sortBy === 'sellingPrice' ? x.sellingPrice : (x as any)[sortBy])
    const va = get(a)
    const vb = get(b)
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = filtered.slice(start, end)
  return { items, total }
}

const createLocal = (input: CreateProductInput): Product => {
  const all = loadLocal()
  const prod: Product = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    barcode: input.barcode?.trim() || undefined,
    name: input.name.trim(),
    category: input.category.trim(),
    costPrice: Math.max(0, Number(input.costPrice) || 0),
    sellingPrice: Math.max(0, Number(input.sellingPrice) || 0),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    description: input.description?.trim() || undefined,
    size: input.size?.trim() || undefined,
    color: input.color?.trim() || undefined,
    stockQuantity: Number(input.stockQuantity) || 0,
    offerType: input.offerType || 'NONE',
    offerValue: Math.max(0, Number(input.offerValue) || 0),
    images: input.images?.slice(0) || [],
  }
  all.unshift(prod)
  saveLocal(all)
  return prod
}

const updateLocal = (id: string, input: UpdateProductInput): Product | null => {
  const all = loadLocal()
  const idx = all.findIndex((p) => p.id === id)
  if (idx === -1) return null
  const next: Product = {
    ...all[idx],
    ...input,
    updatedAt: nowIso(),
  }
  all[idx] = next
  saveLocal(all)
  return next
}

// GraphQL queries (best-guess). If backend differs, calls will fail and fallback to local will be used.
// GraphQL per backend spec provided
const GQL_CATEGORIES = /* GraphQL */ `
  query {
    categories {
      id
      name
    }
  }
`

const GQL_PRODUCTS = /* GraphQL */ `
  query {
    products {
      name
      barcode
      category { name }
      cost_price
      price
      updatedAt
    }
  }
`

const GQL_CREATE_PRODUCT = /* GraphQL */ `
  mutation($createProductInput: CreateProductInput!) {
    createProduct(createProductInput: $createProductInput) {
      name
      barcode
      category { name }
      cost_price
      price
      updatedAt
    }
  }
`

export const inventoryService = {
  categories(): string[] {
    // Legacy synchronous fallback (used by old callers). Real data should come from categoriesAsync().
    return ['SHIRTS', 'JEANS', 'T-SHIRTS', 'SHORTS', 'SWEATERS']
  },

  async categoriesAsync(): Promise<Category[]> {
    try {
      const data = await graphqlClient.query<{ categories: Category[] }>(GQL_CATEGORIES)
      return data?.categories || []
    } catch {
      // Fallback to legacy static list if API fails
      return this.categories().map((name, idx) => ({ id: idx + 1, name }))
    }
  },

  async list(params: ListParams): Promise<ListResult> {
    ensureSeed()
    const { search, category, sortBy = 'updatedAt', sortDir = 'desc', page = 1, pageSize = 50 } = params
    // Try GraphQL first (simple list, then client-side filter/sort/paginate)
    try {
      const data = await graphqlClient.query<{ products: any[] }>(GQL_PRODUCTS)
      const rows = data?.products || []
      const mapped: Product[] = rows.map((r, idx) => {
        const id = r.barcode ? `barcode:${r.barcode}` : `row:${idx}`
        const categoryName: string = r?.category?.name || 'UNCATEGORIZED'
        return {
          id,
          barcode: r.barcode || undefined,
          name: r.name,
          category: categoryName,
          costPrice: Number(r.cost_price) || 0,
          sellingPrice: Number(r.price) || 0,
          createdAt: r.updatedAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString(),
        }
      })
      return toLocalList(mapped, { search, category, sortBy, sortDir, page, pageSize })
    } catch {
      // fall back
    }
    // Local fallback
    return toLocalList(loadLocal(), { search, category, sortBy, sortDir, page, pageSize })
  },

  async create(input: CreateProductInput): Promise<Product> {
    ensureSeed()
    try {
      // Find category id by matching name (case-insensitive)
      const cats = await this.categoriesAsync()
      const want = input.category.trim()
      const found = cats.find((c) => c.name.toLowerCase() === want.toLowerCase())
      const createProductInput = {
        name: input.name.trim(),
        category_id: found?.id ?? cats[0]?.id ?? 1,
        cost_price: Number(input.costPrice) || 0,
        barcode: input.barcode?.trim() || undefined,
        price: Number(input.sellingPrice) || 0,
        // If backend supports this field, use provided stock; otherwise backend may ignore it
        stock_quantity: Number(input.stockQuantity) || 1,
      }
      const data = await graphqlClient.mutate<{ createProduct: any }>(GQL_CREATE_PRODUCT, { createProductInput })
      const r = (data as any)?.createProduct
      if (r) {
        return {
          id: r.barcode ? `barcode:${r.barcode}` : `name:${r.name}`,
          barcode: r.barcode || undefined,
          name: r.name,
          category: r?.category?.name || want,
          costPrice: Number(r.cost_price) || 0,
          sellingPrice: Number(r.price) || 0,
          createdAt: r.updatedAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString(),
          // Echo back optional fields from input so UI can reflect them immediately
          description: input.description?.trim() || undefined,
          size: input.size?.trim() || undefined,
          color: input.color?.trim() || undefined,
          stockQuantity: Number(input.stockQuantity) || 1,
          offerType: input.offerType || 'NONE',
          offerValue: Math.max(0, Number(input.offerValue) || 0),
          images: input.images?.slice(0) || [],
        }
      }
    } catch {
      // fall back
    }
    return createLocal(input)
  },

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    ensureSeed()
    // TODO: Wire backend update mutation when API is available
    return updateLocal(id, input)
  },
}
