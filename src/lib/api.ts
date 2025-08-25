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
