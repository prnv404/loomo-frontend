import { graphqlClient } from './api'

// Authentication Types
export interface LoginInput {
  phone: string
  passcode: string
}

export interface User {
  id: number
  name: string
  phone: string
  role: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

// GraphQL Login Mutation
const LOGIN_MUTATION = `
  mutation Login($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      access_token
      user {
        id
        name
        phone
        role
      }
    }
  }
`

// Authentication Service
export const authService = {
  async login(loginInput: LoginInput): Promise<{ login: LoginResponse }> {
    return graphqlClient.mutate(LOGIN_MUTATION, { loginInput })
  },

  // Store token in localStorage (client-side only)
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  },

  // Get token from localStorage
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  },

  // Remove token
  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  // Store user data
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
    }
  },

  // Get user data
  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  },

  // Logout
  logout(): void {
    this.removeToken()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      // Navigate to login after logout
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
  },
}
