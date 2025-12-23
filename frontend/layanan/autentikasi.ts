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
      // Backend endpoint: POST /api/pengguna/login (sets auth_token cookie)
      const response = await klienApi.post<any>('/api/pengguna/login', data)

      // Response shape: { success: true, message, data: { user: { id, email, peran }, tokens: { accessToken, refreshToken, expiresIn, tokenType } } }
      // Support both new (user) and legacy (pengguna) response formats
      const userData = response?.data?.user || response?.data?.pengguna
      const tokenData = response?.data?.tokens || { accessToken: response?.data?.token, refreshToken: null, expiresIn: 900, tokenType: 'Bearer' }
      
      if (userData) {
        logger.info('Login successful', { userId: userData.id })
        
        // Store access token from response as backup (cookie is primary)
        if (tokenData.accessToken) {
          klienApi.setToken(tokenData.accessToken)
        }
        
        return { 
          pengguna: { 
            id: userData.id, 
            email: userData.email, 
            peran: userData.peran 
          }, 
          tokens: tokenData 
        }
      }

      return response
    } catch (error) {
      logger.error('Login failed', error)
      throw error
    }
  }

  async register(data: any): Promise<ResponsRegister> {
    try {
      logger.info('Attempting registration', { email: data.email })
      // Backend endpoint: POST /api/pengguna/registrasi
      const response = await klienApi.post<any>('/api/pengguna/registrasi', data)

      // Support both new (user) and legacy (pengguna) response formats
      const userData = response?.data?.user || response?.data?.pengguna
      if (userData) {
        logger.info('Registration successful', { userId: userData.id })
        return { pengguna: userData, pesan: response.message } as any
      }

      return response
    } catch (error) {
      logger.error('Registration failed', error)
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await klienApi.post('/api/pengguna/logout')
      // server will clear cookie; client clears any stored token for safety
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
      const response = await klienApi.post<{ accessToken: string }>('/api/auth/refresh')
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
      // Protected endpoint which uses cookie-based auth
      // Response shape: { success: true, data: { user: { id, email, peran } } }
      const response = await klienApi.get<any>('/api/pengguna/profil')
      
      // Extract user data from nested response (support both new and legacy formats)
      const userData = response?.data?.user || response?.data?.pengguna
      if (userData) {
        return {
          id: userData.id,
          email: userData.email,
          peran: userData.peran
        } as Pengguna
      }
      
      return response as Pengguna
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