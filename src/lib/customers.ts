import { graphqlClient, safeQuery, type ApiResponse } from './api'

export type Customer = {
  name: string | null
  phone: string
  dob: string | null
}

const GQL_CUSTOMERS = `
  query Customers {
    customers {
      name
      phone
      dob
    }
  }
`

function mapCustomer(raw: any): Customer {
  return {
    name: raw?.name ?? null,
    phone: raw?.phone ?? '',
    dob: raw?.dob ?? null,
  }
}

async function list(): Promise<Customer[]> {
  const data = await graphqlClient.query<{ customers: any[] }>(GQL_CUSTOMERS)
  const arr = Array.isArray(data?.customers) ? data.customers.map(mapCustomer) : []
  return arr
}

async function listSafe(): Promise<ApiResponse<Customer[]>> {
  const res = await safeQuery<{ customers: any[] }>(GQL_CUSTOMERS)
  if (!res.data) {
    return { data: null, errors: res.errors ?? null }
  }
  const arr = Array.isArray(res.data.customers) ? res.data.customers.map(mapCustomer) : []
  return { data: arr, errors: null }
}

const customersService = { list, listSafe }
export default customersService
