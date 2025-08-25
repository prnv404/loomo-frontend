import { graphqlClient } from './api'

// GraphQL Types
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  createdAt: string
}

export interface HealthStatus {
  status: string
  timestamp: string
  version: string
}

// GraphQL Queries
const GET_USERS = `
  query GetUsers {
    users {
      id
      name
      email
      createdAt
    }
  }
`

const GET_USER = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      createdAt
    }
  }
`

const GET_POSTS = `
  query GetPosts {
    posts {
      id
      title
      content
      authorId
      createdAt
    }
  }
`

const GET_POST = `
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      content
      authorId
      createdAt
    }
  }
`

const HEALTH_CHECK = `
  query HealthCheck {
    health {
      status
      timestamp
      version
    }
  }
`

// GraphQL Mutations
const CREATE_USER = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      createdAt
    }
  }
`

const UPDATE_USER = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      createdAt
    }
  }
`

const DELETE_USER = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`

const CREATE_POST = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      authorId
      createdAt
    }
  }
`

// GraphQL Services
export const userService = {
  async getUsers(): Promise<{ users: User[] }> {
    return graphqlClient.query(GET_USERS)
  },

  async getUser(id: string): Promise<{ user: User }> {
    return graphqlClient.query(GET_USER, { id })
  },

  async createUser(input: Omit<User, 'id' | 'createdAt'>): Promise<{ createUser: User }> {
    return graphqlClient.mutate(CREATE_USER, { input })
  },

  async updateUser(id: string, input: Partial<User>): Promise<{ updateUser: User }> {
    return graphqlClient.mutate(UPDATE_USER, { id, input })
  },

  async deleteUser(id: string): Promise<{ deleteUser: boolean }> {
    return graphqlClient.mutate(DELETE_USER, { id })
  },
}

export const postService = {
  async getPosts(): Promise<{ posts: Post[] }> {
    return graphqlClient.query(GET_POSTS)
  },

  async getPost(id: string): Promise<{ post: Post }> {
    return graphqlClient.query(GET_POST, { id })
  },

  async createPost(input: Omit<Post, 'id' | 'createdAt'>): Promise<{ createPost: Post }> {
    return graphqlClient.mutate(CREATE_POST, { input })
  },
}

export const healthService = {
  async checkHealth(): Promise<{ health: HealthStatus }> {
    return graphqlClient.query(HEALTH_CHECK)
  },
}
