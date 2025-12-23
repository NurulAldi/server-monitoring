'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAutentikasi } from '@/kait/useAutentikasi'
import { klienApi } from '@/layanan/klienApi'

interface AutentikasiContextType {
  user: any
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (data: any) => Promise<any>
  logout: () => Promise<void>
  checkAuthStatus: () => Promise<void>
}

const AutentikasiContext = createContext<AutentikasiContextType | undefined>(undefined)

interface AutentikasiProviderProps {
  children: ReactNode
}

export function AutentikasiProvider({ children }: AutentikasiProviderProps) {
  const {
    pengguna: user,
    sedangMemuat: isLoading,
    error,
    login,
    logout,
    checkAuthStatus
  } = useAutentikasi()

  // Determine token and auth state consistently from API client
  const token = typeof window !== 'undefined' ? klienApi.getToken() : null
  const isAuthenticated = !!user

  const value: AutentikasiContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuthStatus
  }

  return (
    <AutentikasiContext.Provider value={value}>
      {children}
    </AutentikasiContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AutentikasiContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AutentikasiProvider')
  }
  return context
}