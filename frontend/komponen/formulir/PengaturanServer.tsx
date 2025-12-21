'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'
import { Label } from '@/komponen/umum/Label'

const skemaServer = z.object({
  thresholdCpu: z.number().min(1).max(100),
  thresholdMemori: z.number().min(1).max(100),
  thresholdDisk: z.number().min(1).max(100),
  intervalMonitoring: z.number().min(1).max(3600),
})

type DataServer = z.infer<typeof skemaServer>

export default function PengaturanServer() {
  const [sedangMemuat, setSedangMemuat] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DataServer>({
    resolver: zodResolver(skemaServer),
    defaultValues: {
      thresholdCpu: 90,
      thresholdMemori: 85,
      thresholdDisk: 95,
      intervalMonitoring: 60,
    },
  })

  const onSubmit = async (data: DataServer) => {
    setSedangMemuat(true)
    try {
      // TODO: Implementasi update pengaturan server API
      console.log('Pengaturan server:', data)
      // Simulasi delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error update pengaturan:', error)
    } finally {
      setSedangMemuat(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="thresholdCpu">Threshold CPU (%)</Label>
        <Input
          id="thresholdCpu"
          type="number"
          {...register('thresholdCpu', { valueAsNumber: true })}
          className="mt-1"
        />
        {errors.thresholdCpu && (
          <p className="mt-1 text-sm text-red-600">{errors.thresholdCpu.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="thresholdMemori">Threshold Memori (%)</Label>
        <Input
          id="thresholdMemori"
          type="number"
          {...register('thresholdMemori', { valueAsNumber: true })}
          className="mt-1"
        />
        {errors.thresholdMemori && (
          <p className="mt-1 text-sm text-red-600">{errors.thresholdMemori.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="thresholdDisk">Threshold Disk (%)</Label>
        <Input
          id="thresholdDisk"
          type="number"
          {...register('thresholdDisk', { valueAsNumber: true })}
          className="mt-1"
        />
        {errors.thresholdDisk && (
          <p className="mt-1 text-sm text-red-600">{errors.thresholdDisk.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="intervalMonitoring">Interval Monitoring (detik)</Label>
        <Input
          id="intervalMonitoring"
          type="number"
          {...register('intervalMonitoring', { valueAsNumber: true })}
          className="mt-1"
        />
        {errors.intervalMonitoring && (
          <p className="mt-1 text-sm text-red-600">{errors.intervalMonitoring.message}</p>
        )}
      </div>

      <Tombol type="submit" disabled={sedangMemuat}>
        {sedangMemuat ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </Tombol>
    </form>
  )
}