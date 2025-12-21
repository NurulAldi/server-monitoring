# AI System Prompt - Chatbot Monitoring Server

## Overview
Dokumen ini berisi prompt sistem lengkap untuk AI Chatbot yang digunakan dalam sistem monitoring kesehatan server. AI ini dirancang khusus untuk memberikan analisis informatif tentang kondisi server tanpa kemampuan untuk mengambil tindakan langsung.

## File Structure
- `AI_SYSTEM_PROMPT.md` - Prompt sistem lengkap dalam format Markdown
- `layanan/layananChatbotAI.js` - Implementasi AI service dengan prompt terintegrasi

## Key Features

### 1. Bahasa Indonesia
- Semua komunikasi menggunakan Bahasa Indonesia
- Gaya bahasa sederhana dan mudah dipahami
- Tone ramah dan profesional

### 2. Konteks Monitoring Server
Memahami metrik-metrik server berikut:
- **CPU Usage**: Persentase penggunaan CPU (0-100%)
- **Memory Usage**: Persentase penggunaan RAM (0-100%)
- **Disk Usage**: Persentase penggunaan penyimpanan (0-100%)
- **Network I/O**: Kecepatan transfer data jaringan (MB/s)
- **Load Average**: Rata-rata beban sistem
- **Temperature**: Suhu komponen server
- **Uptime**: Waktu server berjalan terus menerus

### 3. Batasan Keamanan
**Yang BISA dilakukan:**
- ✅ Membaca dan menganalisis data metrik
- ✅ Menjelaskan arti angka-angka metrik
- ✅ Memberikan rekomendasi monitoring
- ✅ Menjawab pertanyaan umum

**Yang TIDAK BISA dilakukan:**
- ❌ Mengambil tindakan langsung pada server
- ❌ Mengubah pengaturan atau data
- ❌ Menjalankan perintah sistem
- ❌ Mengakses file di luar monitoring

### 4. Format Jawaban Terstruktur
- **Analisis Data**: Format dengan emoji dan struktur tabel
- **Pertanyaan Umum**: Format sederhana dengan tips
- **Error Handling**: Pesan error yang jelas

## Contoh Penggunaan

### Input User:
```
"Bagaimana kondisi server saya saat ini?"
```

### Output AI:
```
📊 **Analisis Kondisi Server**

**Status Keseluruhan**: Sehat ✅

**Detail Metrik**:
- CPU: 45% - Normal, penggunaan sedang
- Memory: 60% - Sedang, masih ada ruang
- Disk: 70% - Sedang, perlu monitoring
- Network: 25 MB/s - Normal untuk aktivitas biasa

**Rekomendasi**: Server dalam kondisi baik. Lanjutkan monitoring rutin setiap jam.
```

## Implementasi Teknis

### Dependencies
```json
{
  "openai": "^4.0.0"
}
```

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Integration Points
- **Backend**: `layananChatbotAI.js` - AI service layer
- **Controller**: `kontrolerChatbotAI.js` - HTTP endpoints
- **Socket.IO**: Real-time AI responses via `/ai` namespace
- **Frontend**: `ChatbotAI.tsx` - User interface component

## API Endpoints

### Chat AI Endpoints
- `POST /ai/chat` - Kirim pertanyaan ke AI
- `GET /ai/info` - Informasi batasan AI

### Riwayat Chat Endpoints
- `GET /ai/history` - Riwayat chat user dengan pagination
- `GET /ai/stats` - Statistik penggunaan AI chat
- `GET /ai/session/:sessionId` - Detail sesi chat tertentu
- `DELETE /ai/session/:sessionId` - Hapus sesi chat

### Request/Response Examples

#### POST /ai/chat
```json
{
  "pertanyaan": "Bagaimana kondisi server saya?",
  "serverId": "507f1f77bcf86cd799439011",
  "sessionId": "chat_user123_1734762000000_abc123" // optional
}
```

#### GET /ai/history?page=1&limit=10&status=completed
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### GET /ai/stats
```json
{
  "success": true,
  "data": {
    "totalSesi": 25,
    "totalPesan": 150,
    "rataDurasi": 45.2,
    "totalTokens": 12500,
    "errorRate": 0.04,
    "kategoriPopuler": {
      "status": 8,
      "analisis": 12,
      "troubleshooting": 5
    }
  }
}
```

## Maintenance
- **Update Prompt**: Edit `AI_SYSTEM_PROMPT.md` dan sinkronkan ke `layananChatbotAI.js`
- **Security Review**: Lakukan review berkala terhadap kata-kata terlarang
- **Performance**: Monitor token usage dan response time
- **User Feedback**: Kumpulkan feedback untuk improvement

## Security Considerations
1. **Input Validation**: Semua input divalidasi sebelum dikirim ke AI
2. **Output Sanitization**: Response AI dipastikan aman
3. **Rate Limiting**: Implementasi rate limiting pada endpoint
4. **Audit Logging**: Semua interaksi AI dicatat untuk audit

## Future Enhancements
- [ ] Multi-language support
- [ ] Custom AI models
- [ ] Advanced analytics features
- [ ] Integration dengan alerting system
- [ ] Historical trend analysis