// File: app/components/auth/AuthProvider.tsx

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { AuthContextType, User } from '@/types/auth'

// Mock user - temporary until real auth is implemented
const MOCK_USER: User = {
  id: 'admin',
  name: 'Admin User',
  role: 'admin'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Use mock user directly (no localStorage check)
    setUser(MOCK_USER)
    setLoading(false)
  }, [])

  const login = async () => {
    // Placeholder for future real auth
  }

  const logout = async () => {
    // Placeholder for future real auth
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
