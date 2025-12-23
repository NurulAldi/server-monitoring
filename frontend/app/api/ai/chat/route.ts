import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route untuk Chatbot AI
 * Mengirim pertanyaan ke backend dan mengembalikan jawaban AI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pertanyaan, serverId } = body

    // Validasi input
    if (!pertanyaan || typeof pertanyaan !== 'string' || pertanyaan.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pertanyaan tidak valid' },
        { status: 400 }
      )
    }

    // Validasi panjang pertanyaan (maksimal 500 karakter)
    if (pertanyaan.length > 500) {
      return NextResponse.json(
        { success: false, message: 'Pertanyaan terlalu panjang (maksimal 500 karakter)' },
        { status: 400 }
      )
    }

    // Ambil token autentikasi dari cookie atau header
    const authToken = request.cookies.get('authToken')?.value ||
                     request.headers.get('authorization')?.replace('Bearer ', '')

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan' },
        { status: 401 }
      )
    }

    // Kirim request ke backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
    const response = await fetch(`${backendUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        pertanyaan: pertanyaan.trim(),
        serverId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Terjadi kesalahan pada server'
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      jawaban: data.jawaban,
      timestamp: data.timestamp,
      catatan: data.catatan
    })

  } catch (error) {
    console.error('Error dalam API route chatbot:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan internal server'
      },
      { status: 500 }
    )
  }
}

/**
 * Endpoint untuk mendapatkan informasi batasan AI
 */
export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
    const response = await fetch(`${backendUrl}/ai/info`)

    if (!response.ok) {
      throw new Error('Gagal mengambil informasi AI')
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error mengambil info AI:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil informasi AI'
      },
      { status: 500 }
    )
  }
}