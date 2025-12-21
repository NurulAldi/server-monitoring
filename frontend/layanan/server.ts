import { klienApi } from './klienApi'
import { logger } from '@/utilitas/logger'
import type {
  Server,
  StatusServer,
  MetrikServer,
  DataTambahServer,
  DataUpdateServer,
  DataFilterMetrik
} from '@/jenis/server'

export class LayananServer {
  async getSemuaServer(): Promise<Server[]> {
    try {
      const response = await klienApi.get<Server[]>('/server')
      logger.info('Fetched all servers', { count: response.length })
      return response
    } catch (error) {
      logger.error('Failed to fetch servers', error)
      throw error
    }
  }

  async getServerById(id: string): Promise<Server> {
    try {
      const response = await klienApi.get<Server>(`/server/${id}`)
      logger.info('Fetched server by ID', { id })
      return response
    } catch (error) {
      logger.error('Failed to fetch server', { id, error })
      throw error
    }
  }

  async tambahServer(data: DataTambahServer): Promise<Server> {
    try {
      logger.info('Adding new server', { nama: data.nama, ip: data.ip })
      const response = await klienApi.post<Server>('/server', data)
      logger.info('Server added successfully', { id: response.id })
      return response
    } catch (error) {
      logger.error('Failed to add server', error)
      throw error
    }
  }

  async updateServer(data: DataUpdateServer): Promise<Server> {
    try {
      logger.info('Updating server', { id: data.id })
      const response = await klienApi.put<Server>(`/server/${data.id}`, data)
      logger.info('Server updated successfully', { id: data.id })
      return response
    } catch (error) {
      logger.error('Failed to update server', { id: data.id, error })
      throw error
    }
  }

  async hapusServer(id: string): Promise<void> {
    try {
      logger.info('Deleting server', { id })
      await klienApi.delete(`/server/${id}`)
      logger.info('Server deleted successfully', { id })
    } catch (error) {
      logger.error('Failed to delete server', { id, error })
      throw error
    }
  }

  async getStatusServer(): Promise<StatusServer[]> {
    try {
      const response = await klienApi.get<StatusServer[]>('/server/status')
      logger.debug('Fetched server statuses', { count: response.length })
      return response
    } catch (error) {
      logger.error('Failed to fetch server statuses', error)
      throw error
    }
  }

  async getMetrikServer(id: string, filter?: DataFilterMetrik): Promise<MetrikServer[]> {
    try {
      const params = new URLSearchParams()

      if (filter?.mulaiTanggal) params.append('mulaiTanggal', filter.mulaiTanggal)
      if (filter?.akhirTanggal) params.append('akhirTanggal', filter.akhirTanggal)
      if (filter?.interval) params.append('interval', filter.interval)
      if (filter?.limit) params.append('limit', filter.limit.toString())

      const query = params.toString()
      const url = `/server/${id}/metrik${query ? `?${query}` : ''}`

      const response = await klienApi.get<MetrikServer[]>(url)
      logger.debug('Fetched server metrics', { id, count: response.length })
      return response
    } catch (error) {
      logger.error('Failed to fetch server metrics', { id, error })
      throw error
    }
  }

  async getMetrikTerakhir(id: string): Promise<MetrikServer> {
    try {
      const response = await klienApi.get<MetrikServer>(`/server/${id}/metrik/terakhir`)
      logger.debug('Fetched latest server metrics', { id })
      return response
    } catch (error) {
      logger.error('Failed to fetch latest server metrics', { id, error })
      throw error
    }
  }

  async testKoneksiServer(id: string): Promise<{ sukses: boolean; pesan: string }> {
    try {
      logger.info('Testing server connection', { id })
      const response = await klienApi.post<{ sukses: boolean; pesan: string }>(`/server/${id}/test`)
      logger.info('Server connection test completed', { id, sukses: response.sukses })
      return response
    } catch (error) {
      logger.error('Server connection test failed', { id, error })
      throw error
    }
  }

  async restartMonitoring(id: string): Promise<{ pesan: string }> {
    try {
      logger.info('Restarting server monitoring', { id })
      const response = await klienApi.post<{ pesan: string }>(`/server/${id}/restart-monitoring`)
      logger.info('Server monitoring restarted', { id })
      return response
    } catch (error) {
      logger.error('Failed to restart server monitoring', { id, error })
      throw error
    }
  }

  async getKonfigurasiServer(id: string): Promise<any> {
    try {
      const response = await klienApi.get(`/server/${id}/konfigurasi`)
      logger.debug('Fetched server configuration', { id })
      return response
    } catch (error) {
      logger.error('Failed to fetch server configuration', { id, error })
      throw error
    }
  }

  async updateKonfigurasiServer(id: string, konfigurasi: any): Promise<any> {
    try {
      logger.info('Updating server configuration', { id })
      const response = await klienApi.put(`/server/${id}/konfigurasi`, konfigurasi)
      logger.info('Server configuration updated', { id })
      return response
    } catch (error) {
      logger.error('Failed to update server configuration', { id, error })
      throw error
    }
  }
}

// Export singleton instance
export const layananServer = new LayananServer()