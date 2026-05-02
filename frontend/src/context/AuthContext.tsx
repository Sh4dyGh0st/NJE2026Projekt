import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AuthState {
  userId: number | null
  role: 'Admin' | 'User' | null
}

interface AuthContextType extends AuthState {
  login: (userId: number, role: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const userId = sessionStorage.getItem('userId')
    const role = sessionStorage.getItem('role') as 'Admin' | 'User' | null
    return {
      userId: userId ? parseInt(userId) : null,
      role: role
    }
  })

  const login = (userId: number, role: string) => {
    sessionStorage.setItem('userId', userId.toString())
    sessionStorage.setItem('role', role)
    setAuth({ userId, role: role as 'Admin' | 'User' })
  }

  const logout = () => {
    sessionStorage.removeItem('userId')
    sessionStorage.removeItem('role')
    setAuth({ userId: null, role: null })
  }

  return (
    <AuthContext.Provider value={{
      ...auth,
      login,
      logout,
      isAuthenticated: auth.userId !== null
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
