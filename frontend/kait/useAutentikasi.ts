'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { layananAutentikasi } from '@/layanan/autentikasi'
import { klienApi } from '@/layanan/klienApi'
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

  const router = useRouter()

  const logout = useCallback(async () => {
    // Perform server logout first so middleware sees the logged-out state
    setSedangMemuat(true)
    setError(null)
    logger.userAction('logout')

    try {
      // Call server logout API (sends auth cookies via credentials: 'include')
      await layananAutentikasi.logout()

      // Immediately purge all global states after successful API call
      setPengguna(null)
      klienApi.setToken(null) // Clear any remaining token
      localStorage.removeItem('auth_token') // Clear backup token
      sessionStorage.clear() // Clear any session data

      // Hard redirect to login page (do not wait for other processes)
      window.location.href = '/autentikasi?logged_out=1'
    } catch (err) {
      // If server logout fails, still clear local state and redirect
      logger.error('Logout failed', err)
      setPengguna(null)
      klienApi.setToken(null)
      localStorage.removeItem('auth_token')
      sessionStorage.clear()
      window.location.href = '/autentikasi?logged_out=1'
    } finally {
      setSedangMemuat(false)
    }
  }, [router])

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