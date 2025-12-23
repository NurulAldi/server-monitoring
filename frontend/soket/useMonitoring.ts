'use client'

import { useState, useEffect } from 'react'
import { klienApi } from '@/layanan/klienApi'

interface DataRingkasan {
  totalServer: number
  sehat: number
  peringatan: number
  kritis: number
  bahaya: number
  offline: number
}

interface MetrikGlobal {
  cpuRataRata: number
  memoriRataRata: number
  alertAktif: number
}

interface DataMonitoring {
  ringkasan: DataRingkasan
  metrikGlobal: MetrikGlobal
}

export function useMonitoringData() {
  const [data, setData] = useState<DataMonitoring | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await klienApi.get('/api/monitoring')
        if (response.data.success) {
          setData(response.data.data)
        } else {
          setError('Failed to fetch monitoring data')
        }
      } catch (err) {
        setError('Failed to fetch monitoring data')
        console.error('Monitoring data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up polling every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  return { data, loading, error }
}