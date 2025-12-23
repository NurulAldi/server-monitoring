import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { KONSTANTA } from '@/utilitas/konstanta'
import { logger } from '@/utilitas/logger'

class KlienApi {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    // Normalize base URL to avoid accidental trailing '/api' which causes double '/api/api' issues
    const normalizedBaseURL = (KONSTANTA.API_BASE_URL || '').replace(/\/api\/?$/i, '').replace(/\/$/, '') || '';

    this.client = axios.create({
      baseURL: normalizedBaseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // enable cookies for auth flows
    })

    this.setupInterceptors()

    // Enhance error handling: attach attemptedURL when a request fails without response
    const origInterceptor = this.client.interceptors.response.handlers.slice()
    this.client.interceptors.response.use(undefined, (error) => {
      try {
        const cfg = error.config || {}
        const base = cfg.baseURL || normalizedBaseURL || ''
        const url = cfg.url || ''
        const sep = base.endsWith('/') || url.startsWith('/') ? '' : '/'
        error.attemptedURL = `${base}${sep}${url}`
        logger.error('HTTP request failed', { attemptedURL: error.attemptedURL, message: error.message })
      } catch (e) {
        logger.error('Failed to compute attemptedURL for failed request', e)
      }
      return Promise.reject(error)
    })
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now()
        config.metadata = { startTime }

        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }

        logger.apiCall(config.method?.toUpperCase() || 'UNKNOWN', config.url || '')
        return config
      },
      (error) => {
        logger.error('Request interceptor error', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const startTime = response.config.metadata?.startTime
        const duration = startTime ? Date.now() - startTime : 0

        logger.apiCall(
          response.config.method?.toUpperCase() || 'UNKNOWN',
          response.config.url || '',
          response.status,
          duration
        )
        return response
      },
      (error: AxiosError) => {
        const startTime = error.config?.metadata?.startTime
        const duration = startTime ? Date.now() - startTime : 0

        logger.apiCall(
          error.config?.method?.toUpperCase() || 'UNKNOWN',
          error.config?.url || '',
          error.response?.status,
          duration
        )

        // Handle common errors
        if (error.response?.status === 401) {
          this.handleUnauthorized()
        } else if (error.response?.status === 403) {
          logger.warn('Forbidden access', error.response.data)
        } else if (error.response?.status >= 500) {
          logger.error('Server error', error.response.data)
        }

        return Promise.reject(error)
      }
    )
  }

  private handleUnauthorized() {
    logger.warn('Unauthorized access - clearing token and redirecting to login')
    this.setToken(null)
    // Clear any stored user data
    localStorage.removeItem('auth_token')
    sessionStorage.clear()
    
    // Only redirect if not already on login page
    if (!window.location.pathname.startsWith('/autentikasi')) {
      // Hard redirect to login page as fail-safe
      window.location.href = '/autentikasi?unauthorized=1'
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  // Generic API methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.get(url, { params })
    return response.data
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data)
    return response.data
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data)
    return response.data
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch(url, data)
    return response.data
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.client.delete(url)
    return response.data
  }
}

// Export singleton instance
export const klienApi = new KlienApi()