'use client'

import { useState } from 'react'
import { Tombol } from '@/komponen/umum/Tombol'
import { Label } from '@/komponen/umum/Label'

export default function PengaturanNotifikasi() {
  const [sedangMemuat, setSedangMemuat] = useState(false)
  const [pengaturan, setPengaturan] = useState({
    emailAlert: true,
    pushNotification: false,
    smsAlert: false,
    alertKritis: true,
    alertPeringatan: true,
    alertInfo: false,
  })

  const handleChange = (key: string, value: boolean) => {
    setPengaturan(prev => ({ ...prev, [key]: value }))
  }

  const onSubmit = async () => {
    setSedangMemuat(true)
    try {
      // TODO: Implementasi update pengaturan notifikasi API
      console.log('Pengaturan notifikasi:', pengaturan)
      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error update pengaturan:', error)
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-heading-md font-medium text-high-contrast mb-4">
          Metode Notifikasi
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="emailAlert"
              type="checkbox"
              checked={pengaturan.emailAlert}
              onChange={(e) => handleChange('emailAlert', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="emailAlert" className="ml-2">
              Notifikasi Email
            </Label>
          </div>

          <div className="flex items-center">
            <input
              id="pushNotification"
              type="checkbox"
              checked={pengaturan.pushNotification}
              onChange={(e) => handleChange('pushNotification', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="pushNotification" className="ml-2">
              Push Notification Browser
            </Label>
          </div>

          <div className="flex items-center">
            <input
              id="smsAlert"
              type="checkbox"
              checked={pengaturan.smsAlert}
              onChange={(e) => handleChange('smsAlert', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="smsAlert" className="ml-2">
              SMS Alert
            </Label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tingkat Alert
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="alertKritis"
              type="checkbox"
              checked={pengaturan.alertKritis}
              onChange={(e) => handleChange('alertKritis', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="alertKritis" className="ml-2">
              Alert Kritis
            </Label>
          </div>

          <div className="flex items-center">
            <input
              id="alertPeringatan"
              type="checkbox"
              checked={pengaturan.alertPeringatan}
              onChange={(e) => handleChange('alertPeringatan', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="alertPeringatan" className="ml-2">
              Alert Peringatan
            </Label>
          </div>

          <div className="flex items-center">
            <input
              id="alertInfo"
              type="checkbox"
              checked={pengaturan.alertInfo}
              onChange={(e) => handleChange('alertInfo', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="alertInfo" className="ml-2">
              Alert Informasi
            </Label>
          </div>
        </div>
      </div>

      <Tombol onClick={onSubmit} disabled={sedangMemuat}>
        {sedangMemuat ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </Tombol>
    </div>
  )
}