'use client'

import { useState, useEffect, useCallback } from 'react'
import { layananAutentikasi } from '@/layanan/autentikasi'
import { logger } from '@/utilitas/logger'
import type { Pengguna, DataLogin, ResponsLogin } from '@/jenis/autentikasi'

export function useAutentikasi() {
  const [pengguna, setPengguna] = useState<Pengguna | null>(null)
  const [sedangMemuat, setSedangMemuat] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = useCallback(async () => {
    try {
      setSedangMemuat(true)
      setError(null)

      // Attempt to get profile using cookie-based session (if any)
      try {
        const profil = await layananAutentikasi.getProfil()
        setPengguna(profil)
        logger.info('User authenticated', { userId: profil.id })
      } catch (profileErr) {
        // Not authenticated
        setPengguna(null)
      }
    } catch (err) {
      logger.error('Authentication check failed', err)
      setError('Gagal memeriksa status autentikasi')
      setPengguna(null)
    } finally {
      setSedangMemuat(false)
    }
  }, [])

  const login = useCallback(async (data: DataLogin): Promise<ResponsLogin> => {
    try {
      setSedangMemuat(true)
      setError(null)

      const response = await layananAutentikasi.login(data)
      setPengguna(response.pengguna)

      logger.userAction('login', { userId: response.pengguna.id })
      return response
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Login gagal'
      setError(errorMessage)
      logger.error('Login failed', err)
      throw err
    } finally {
      setSedangMemuat(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      setSedangMemuat(true)
      await layananAutentikasi.logout()
      setPengguna(null)
      setError(null)
      logger.userAction('logout')
    } catch (err) {
      logger.error('Logout failed', err)
      // Clear user anyway
      setPengguna(null)
    } finally {
      setSedangMemuat(false)
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    try {
      await layananAutentikasi.refreshToken()
      await checkAuthStatus()
    } catch (err) {
      logger.error('Token refresh failed', err)
      setPengguna(null)
    }
  }, [checkAuthStatus])

  return {
    pengguna,
    sedangMemuat,
    error,
    isAuthenticated: !!pengguna,
    login,
    logout,
    refreshAuth,
    checkAuthStatus,
  }
}