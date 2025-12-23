# Dashboard Monitoring Server Kesehatan

Dashboard frontend untuk sistem monitoring kesehatan server dengan real-time updates menggunakan Next.js, TypeScript, dan Socket.IO.

## Teknologi

- **Next.js 14** - React framework dengan App Router
- **TypeScript** - Type safety dan developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **React Hook Form + Zod** - Form handling dan validation
- **Recharts** - Data visualization
- **Axios** - HTTP client

## Struktur Folder

```
frontend/
├── app/                    # Next.js App Router
│   ├── autentikasi/       # Halaman autentikasi
│   ├── dashboard/         # Dashboard utama
│   ├── admin/             # Panel admin
│   └── api/               # API routes
├── komponen/              # Reusable components
│   ├── umum/              # Common components
│   ├── pemantauan/        # Monitoring components
│   ├── peringatan/        # Alert components
│   ├── obrolan/           # Chat components
│   ├── formulir/          # Form components
│   └── bagan/             # Chart components
├── kait/                  # Custom hooks
├── layanan/               # API services
├── soket/                 # Socket.IO client
├── utilitas/              # Utility functions
├── jenis/                 # TypeScript types
└── gaya/                  # Styling
```

## AI Chatbot Assistant

Komponen AI chatbot terintegrasi untuk analisis kesehatan server dengan interface chat real-time.

### Komponen AI

#### ChatbotAI (`komponen/umum/ChatbotAI.tsx`)
Komponen utama chatbot dengan fitur:

- **Interface Chat Real-time:** UI chat dengan pesan user dan AI
- **Validasi Input:** Pengecekan input sebelum dikirim ke backend
- **Error Handling:** Penanganan error dan loading states
- **Auto-scroll:** Otomatis scroll ke pesan terbaru
- **Disclaimer:** Penampilan batasan AI secara jelas

#### API Route (`app/api/ai/chat/route.ts`)
Proxy API untuk komunikasi dengan backend AI:

- **Authentication:** Forward JWT token ke backend
- **Input Validation:** Validasi pertanyaan di frontend
- **Error Handling:** Proper error responses
- **Rate Limiting:** Client-side rate limiting

### Peran dan Batasan AI

#### ✅ Yang Diperbolehkan:
- **Menjawab pertanyaan** tentang sistem monitoring
- **Menganalisis data** kesehatan server (CPU, memory, dll.)
- **Menjelaskan makna** perubahan data dan tren

#### ❌ Yang Dilarang:
- **Mengambil tindakan** langsung pada sistem
- **Mengubah data** atau konfigurasi
- **Membuat keputusan** sistem otomatis

### Penggunaan di Dashboard

Chatbot AI terintegrasi di halaman dashboard utama:

```tsx
// Di app/dashboard/page.tsx
import ChatbotAI from '@/komponen/umum/ChatbotAI'

// Dalam komponen
<ChatbotAI className="h-96" />
```

### Mekanisme Keamanan

1. **Input Sanitization:** Semua input divalidasi sebelum dikirim
2. **Rate Limiting:** Batas maksimal pertanyaan per menit
3. **Content Filtering:** Deteksi kata kunci berbahaya
4. **Session Management:** AI hanya aktif untuk user terautentikasi
5. **Audit Trail:** Logging semua interaksi untuk monitoring

### Contoh Interaksi

**User:** "CPU server X naik 20%, apa artinya?"
**AI:** "Peningkatan CPU 20% menunjukkan beban tinggi. Berdasarkan data, ini mungkin disebabkan oleh..."

**User:** "Restart server production"
**AI:** "Maaf, saya tidak dapat menjalankan perintah tersebut. Silakan gunakan kontrol manual di dashboard."

### State Management

- **Local State:** Pesan chat disimpan di komponen
- **Real-time Updates:** Socket connection untuk status server
- **Error States:** Proper error display dan recovery
- **Loading States:** Visual feedback saat AI memproses

### Styling dan UX

- **Responsive Design:** Chatbot adaptif untuk mobile dan desktop
- **Dark Theme:** Konsisten dengan tema aplikasi
- **Accessibility:** Proper ARIA labels dan keyboard navigation
- **Visual Feedback:** Loading indicators dan status messages

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Buka [http://localhost:3000](http://localhost:3000) di browser.

## Environment Variables

Buat file `.env.local` dengan:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint check
- `npm run type-check` - TypeScript check