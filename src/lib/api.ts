// GraphQL API Configuration and Utilities
const getGraphQLUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: use DEV_URL or PROD_URL
    return process.env.NODE_ENV === 'development' 
      ? process.env.DEV_URL || 'http://localhost:3000/graphql'
      : process.env.PROD_URL || 'https://your-api-domain.com/graphql'
  }
  // Client-side: use NEXT_PUBLIC_API_URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/graphql'
}

export const GRAPHQL_ENDPOINT = getGraphQLUrl()

// GraphQL Response Types
export interface GraphQLResponse<T = any> {
  data?: T
  errors?: GraphQLError[]
}

export interface GraphQLError {
  message: string
  locations?: Array<{ line: number; column: number }>
  path?: string[]
  // Some servers provide a top-level code
  code?: string
  extensions?: Record<string, any>
}

// Generic API error/response shapes for app-wide handling
export type ApiError = {
  message: string
  code: string
  details: string
  path: string[]
}

export type ApiResponse<T> = {
  errors: ApiError[] | null
  data: T | null
}

// Normalize GraphQL errors to ApiError[] (generic, no hard-coded codes)
export function normalizeGraphQLErrors(errors?: GraphQLError[] | null): ApiError[] {
  if (!errors || errors.length === 0) return []
  return errors.map((e) => ({
    message: e.message || 'Error',
    code: String((e.extensions?.code ?? e.code ?? 'UNKNOWN')),
    details: String((e.extensions?.details ?? e.message ?? '')),
    path: Array.isArray(e.path) ? e.path : [],
  }))
}

// Convenience helpers
export function firstApiError(errors: ApiError[] | null | undefined): ApiError | null {
  return errors && errors.length > 0 ? errors[0] : null
}

export function formatApiError(errors: ApiError[] | null | undefined, fallback = 'Something went wrong'): string {
  const e = firstApiError(errors)
  if (!e) return fallback
  // Prefer details when present; fallback to message
  return e.details?.toString?.() || e.message || fallback
}

export interface GraphQLRequest {
  query: string
  variables?: Record<string, any>
  operationName?: string
}

// GraphQL Client
class GraphQLClient {
  private endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  async request<T>(
    query: string,
    variables?: Record<string, any>,
    options?: RequestInit
  ): Promise<GraphQLResponse<T>> {
    const requestBody: GraphQLRequest = {
      query,
      variables,
    }

    // Helper: read token from localStorage (client-only)
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: JSON.stringify(requestBody),
      ...options,
    }

    try {
      const response = await fetch(this.endpoint, config)
      
      if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
          // Clear auth and redirect to login
          try {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
          } catch {}
          if (window.location.pathname !== '/login') {
            window.location.assign('/login')
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: GraphQLResponse<T> = await response.json()
      
      const unauthorized = (err: GraphQLError) => {
        const code = err.code || err.extensions?.code
        return (
          code === 'UNAUTHORIZED' ||
          code === 'UNAUTHENTICATED' ||
          /unauthorized/i.test(err.message)
        )
      }

      if (result.errors && result.errors.length > 0) {
        // If any unauthorized error, clear auth and redirect (client only)
        if (result.errors.some(unauthorized) && typeof window !== 'undefined') {
          try {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
          } catch {}
          if (window.location.pathname !== '/login') {
            window.location.assign('/login')
          }
        }
        throw new GraphQLClientError(result.errors)
      }

      return result
    } catch (error) {
      if (error instanceof GraphQLClientError) {
        throw error
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown GraphQL error')
    }
  }

  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.request<T>(query, variables)
    return response.data as T
  }

  async mutate<T>(mutation: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.request<T>(mutation, variables)
    return response.data as T
  }
}

// GraphQL Error Class
class GraphQLClientError extends Error {
  public errors: GraphQLError[]

  constructor(errors: GraphQLError[]) {
    const message = errors.map(error => error.message).join(', ')
    super(message)
    this.name = 'GraphQLClientError'
    this.errors = errors
  }
}

// Create GraphQL client instance
export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT)

// Safe helpers that never throw; return ApiResponse<T>
export async function safeQuery<T>(query: string, variables?: Record<string, any>): Promise<ApiResponse<T>> {
  try {
    const result = await graphqlClient.request<T>(query, variables)
    return {
      data: (result?.data as T) ?? null,
      errors: result?.errors ? normalizeGraphQLErrors(result.errors) : null,
    }
  } catch (err: any) {
    if (err instanceof GraphQLClientError) {
      return { data: null, errors: normalizeGraphQLErrors(err.errors) }
    }
    // Network or unknown error
    return {
      data: null,
      errors: [
        {
          message: err?.message || 'Unknown error',
          code: String(err?.code ?? 'UNKNOWN'),
          details: String(err?.message ?? ''),
          path: [],
        },
      ],
    }
  }
}

export async function safeMutate<T>(mutation: string, variables?: Record<string, any>): Promise<ApiResponse<T>> {
  // Mutations are also POST requests; share the same handler
  return safeQuery<T>(mutation, variables)
}

// Custom hook for GraphQL calls with error handling
export function useGraphQL() {
  const handleQuery = async <T>(
    query: string,
    variables?: Record<string, any>
  ): Promise<{ data: T | null; error: string | null; loading: boolean }> => {
    try {
      const data = await graphqlClient.query<T>(query, variables)
      return { data, error: null, loading: false }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        loading: false,
      }
    }
  }

  const handleMutation = async <T>(
    mutation: string,
    variables?: Record<string, any>
  ): Promise<{ data: T | null; error: string | null; loading: boolean }> => {
    try {
      const data = await graphqlClient.mutate<T>(mutation, variables)
      return { data, error: null, loading: false }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        loading: false,
      }
    }
  }

  return { handleQuery, handleMutation }
}

// Lightweight hook to use the safe helpers in components
export function useSafeGraphQL() {
  return {
    query: safeQuery,
    mutate: safeMutate,
  }
}
