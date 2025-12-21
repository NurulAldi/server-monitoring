'use client'

import { useState } from 'react'
import { Kartu, HeaderKartu, JudulKartu, KontenKartu } from '@/komponen/umum/Kartu'
import { Tombol } from '@/komponen/umum/Tombol'
import { Input } from '@/komponen/umum/Input'

interface Pesan {
  id: string
  pengirim: 'user' | 'ai'
  isi: string
  waktu: string
}

export default function ObrolanAI() {
  const [pesan, setPesan] = useState('')
  const [sedangMemuat, setSedangMemuat] = useState(false)

  // TODO: Fetch riwayat chat dari API
  const [riwayatPesan, setRiwayatPesan] = useState<Pesan[]>([
    {
      id: '1',
      pengirim: 'ai',
      isi: 'Halo! Saya adalah AI asisten untuk monitoring server. Apa yang bisa saya bantu hari ini?',
      waktu: '10:00',
    },
  ])

  const kirimPesan = async () => {
    if (!pesan.trim()) return

    const pesanBaru: Pesan = {
      id: Date.now().toString(),
      pengirim: 'user',
      isi: pesan,
      waktu: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setRiwayatPesan((prev) => [...prev, pesanBaru])
    setPesan('')
    setSedangMemuat(true)

    try {
      // TODO: Kirim pesan ke API chat AI
      // Simulasi response AI
      setTimeout(() => {
        const responseAI: Pesan = {
          id: (Date.now() + 1).toString(),
          pengirim: 'ai',
          isi: 'Terima kasih atas pertanyaan Anda. Saya sedang memproses informasi server untuk memberikan jawaban yang akurat.',
          waktu: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }
        setRiwayatPesan((prev) => [...prev, responseAI])
        setSedangMemuat(false)
      }, 2000)
    } catch (error) {
      console.error('Error mengirim pesan:', error)
      setSedangMemuat(false)
    }
  }

  return (
    <div className="flex flex-col h-96">
      {/* Area Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {riwayatPesan.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.pengirim === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.pengirim === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.isi}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.pengirim === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {msg.waktu}
              </p>
            </div>
          </div>
        ))}

        {sedangMemuat && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            placeholder="Ketik pesan Anda..."
            onKeyPress={(e) => e.key === 'Enter' && kirimPesan()}
            className="flex-1"
          />
          <Tombol
            onClick={kirimPesan}
            disabled={sedangMemuat || !pesan.trim()}
          >
            Kirim
          </Tombol>
        </div>
      </div>
    </div>
  )
}