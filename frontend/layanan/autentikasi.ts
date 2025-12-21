import { klienApi } from './klienApi'
import { logger } from '@/utilitas/logger'
import type {
  DataLogin,
  DataRegister,
  DataResetPassword,
  DataUbahPassword,
  ResponsLogin,
  ResponsRegister,
  Pengguna
} from '@/jenis/autentikasi'

export class LayananAutentikasi {
  async login(data: DataLogin): Promise<ResponsLogin> {
    try {
      logger.info('Attempting login', { email: data.email })
      const response = await klienApi.post<ResponsLogin>('/autentikasi/login', data)

      if (response.token) {
        klienApi.setToken(response.token.accessToken)
        logger.info('Login successful', { userId: response.pengguna.id })
      }

      return response
    } catch (error) {
      logger.error('Login failed', error)
      throw error
    }
  }

  async register(data: DataRegister): Promise<ResponsRegister> {
    try {
      logger.info('Attempting registration', { email: data.email })
      const response = await klienApi.post<ResponsRegister>('/autentikasi/register', data)
      logger.info('Registration successful', { userId: response.pengguna.id })
      return response
    } catch (error) {
      logger.error('Registration failed', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await klienApi.post('/autentikasi/logout')
      klienApi.setToken(null)
      logger.info('Logout successful')
    } catch (error) {
      logger.error('Logout failed', error)
      // Clear token anyway
      klienApi.setToken(null)
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await klienApi.post<{ accessToken: string }>('/autentikasi/refresh')
      klienApi.setToken(response.accessToken)
      logger.info('Token refreshed successfully')
      return response.accessToken
    } catch (error) {
      logger.error('Token refresh failed', error)
      throw error
    }
  }

  async resetPassword(data: DataResetPassword): Promise<{ pesan: string }> {
    try {
      logger.info('Password reset requested', { email: data.email })
      const response = await klienApi.post<{ pesan: string }>('/autentikasi/reset-password', data)
      logger.info('Password reset email sent')
      return response
    } catch (error) {
      logger.error('Password reset failed', error)
      throw error
    }
  }

  async ubahPassword(data: DataUbahPassword): Promise<{ pesan: string }> {
    try {
      logger.info('Attempting password change')
      const response = await klienApi.post<{ pesan: string }>('/autentikasi/change-password', data)
      logger.info('Password changed successfully')
      return response
    } catch (error) {
      logger.error('Password change failed', error)
      throw error
    }
  }

  async getProfil(): Promise<Pengguna> {
    try {
      const response = await klienApi.get<Pengguna>('/pengguna/profil')
      return response
    } catch (error) {
      logger.error('Failed to get user profile', error)
      throw error
    }
  }

  async updateProfil(data: Partial<Pengguna>): Promise<Pengguna> {
    try {
      logger.info('Updating user profile')
      const response = await klienApi.put<Pengguna>('/pengguna/profil', data)
      logger.info('Profile updated successfully')
      return response
    } catch (error) {
      logger.error('Profile update failed', error)
      throw error
    }
  }

  async verifikasiEmail(token: string): Promise<{ pesan: string }> {
    try {
      logger.info('Verifying email')
      const response = await klienApi.post<{ pesan: string }>('/autentikasi/verify-email', { token })
      logger.info('Email verified successfully')
      return response
    } catch (error) {
      logger.error('Email verification failed', error)
      throw error
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!klienApi.getToken()
  }

  getToken(): string | null {
    return klienApi.getToken()
  }
}

// Export singleton instance
export const layananAutentikasi = new LayananAutentikasi()