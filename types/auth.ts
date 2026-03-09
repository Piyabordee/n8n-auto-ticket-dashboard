// File: types/auth.ts

export interface User {
  id: string
  name: string
  email?: string
  role?: 'admin' | 'user'
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}
