# Backend Sistem Monitoring Health Server

Backend untuk aplikasi Sistem Monitoring Health Server berbasis Express.js dengan fitur real-time menggunakan Socket.IO, autentikasi JWT, email notification, dan AI chatbot.

## Fitur Utama

- ✅ API REST untuk monitoring server
- ✅ Real-time update dengan Socket.IO
- ✅ Autentikasi user dengan JWT
- ✅ Email notification untuk alert
- ✅ AI chatbot untuk analisis server
- ✅ Data dummy generator terjadwal
- ✅ Database MongoDB

## Struktur Folder

```
backend/
├── src/
│   ├── konfigurasi/     # Konfigurasi database, email, JWT, AI
│   ├── model/           # Mongoose schemas
│   ├── rute/            # Express routes
│   ├── kontroler/       # Request handlers
│   ├── layanan/         # Business logic
│   ├── middleware/      # Express middleware
│   ├── socket/          # Socket.IO handlers
│   ├── utilitas/        # Helper functions
│   ├── penjadwal/       # Cron jobs
│   └── server.js        # Entry point
├── .env                 # Environment variables
├── .env.example         # Template .env
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies
└── README.md            # Dokumentasi ini
```

## Setup Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan nilai yang sesuai:
- `MONGODB_URI`: Connection string MongoDB
- `JWT_SECRET`: Secret key untuk JWT (minimal 32 karakter)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: Konfigurasi email
- `OPENAI_API_KEY` atau `GEMINI_API_KEY`: API key untuk AI

### 3. Jalankan MongoDB

Pastikan MongoDB berjalan di lokal atau gunakan MongoDB Atlas.

### 4. Jalankan Server

```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:5000` (atau port yang diset di `.env`).

## API Endpoints

### Autentikasi
- `POST /api/pengguna/registrasi` - Registrasi user baru
- `POST /api/pengguna/login` - Login user
- `POST /api/pengguna/logout` - Logout user

### Server
- `GET /api/server` - List semua server
- `GET /api/server/:id` - Detail server
- `POST /api/server` - Tambah server baru (admin)
- `PUT /api/server/:id` - Update server (admin)
- `DELETE /api/server/:id` - Hapus server (admin)

### Metrik
- `GET /api/metrik/:idServer/terkini` - Metrics terkini server
- `GET /api/metrik/:idServer/histori` - Histori metrics 24 jam

### Alert
- `GET /api/alert` - List alert dengan pagination
- `GET /api/alert/:idServer` - Alert untuk server tertentu

### Chat AI
- `POST /api/chat/tanya` - Tanya ke AI chatbot
- `GET /api/chat/histori` - Histori chat user

### Konfigurasi (Admin)
- `GET /api/konfigurasi` - List semua konfigurasi
- `PUT /api/konfigurasi/:kunci` - Update konfigurasi

## Socket.IO Events

### Client → Server
- `subscribe` - Subscribe ke server tertentu
- `unsubscribe` - Unsubscribe dari server

### Server → Client
- `metricsUpdate` - Update metrics real-time
- `alertNotification` - Notifikasi alert baru
- `dataInitial` - Data awal saat connect

## Sistem Email & Notifikasi

Sistem email terintegrasi penuh untuk notifikasi kondisi server dan komunikasi user.

### Konfigurasi Email

Setup SMTP di file `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Provider Email yang Didukung:**
- Gmail (smtp.gmail.com:587)
- Outlook (smtp-mail.outlook.com:587)
- Yahoo (smtp.mail.yahoo.com:587)
- SendGrid, Mailgun, dll.

### Jenis Email yang Dikirim

#### 1. Email Verifikasi Akun
- **Kapan:** Saat user registrasi
- **Tujuan:** Verifikasi email user
- **Template:** Link verifikasi 24 jam

#### 2. Email Alert Server
- **Kapan:** Server CRITICAL/WARNING
- **Tujuan:** Notifikasi immediate masalah server
- **Template:** Detail metrics + rekomendasi AI

#### 3. Email Recovery
- **Kapan:** Server kembali normal setelah alert
- **Tujuan:** Konfirmasi server sudah sehat
- **Template:** Durasi downtime + status terkini

## AI Chatbot Assistant

Sistem AI chatbot terintegrasi untuk membantu analisis kesehatan server dengan batasan ketat untuk keamanan.

### Peran AI (Yang Diperbolehkan)

✅ **Menjawab Pertanyaan User:**
- Informasi tentang sistem monitoring
- Penjelasan fitur dashboard
- Bantuan navigasi aplikasi

✅ **Menganalisis Data Health Server:**
- Analisis metrik CPU, memory, disk, network
- Identifikasi pola dan tren
- Deteksi anomali data

✅ **Menjelaskan Makna Perubahan Data:**
- Interpretasi signifikansi perubahan metrik
- Penjelasan dampak terhadap kesehatan server
- Rekomendasi informatif (bukan instruksi eksekusi)

### Batasan AI (Yang DILARANG)

❌ **TIDAK BOLEH Mengambil Tindakan Langsung:**
- Tidak bisa restart server
- Tidak bisa mengubah konfigurasi
- Tidak bisa menjalankan perintah sistem

❌ **TIDAK BOLEH Mengubah Data:**
- Tidak bisa edit data metrik
- Tidak bisa hapus atau tambah data
- Tidak bisa memanipulasi database

❌ **TIDAK BOLEH Membuat Keputusan Sistem:**
- Tidak bisa mengambil keputusan otomatis
- Tidak bisa memberikan instruksi eksekusi
- Tidak bisa menggantikan kontrol manusia

### Konfigurasi AI

Setup API key di file `.env`:

```env
# OpenAI (recommended)
OPENAI_API_KEY=your_openai_api_key_here

# Atau Gemini (alternative)
GEMINI_API_KEY=your_gemini_api_key
```

### API Endpoints AI

#### POST /ai/chat
Endpoint utama untuk interaksi chatbot.

**Request Body:**
```json
{
  "pertanyaan": "string - Pertanyaan user",
  "serverId": "string - Opsional, ID server untuk analisis spesifik"
}
```

**Response:**
```json
{
  "success": true,
  "jawaban": "string - Jawaban AI",
  "timestamp": "2025-12-21T10:30:00.000Z",
  "catatan": "string - Disclaimer batasan AI"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Pertanyaan mengandung instruksi yang tidak diperbolehkan"
}
```

#### GET /ai/info
Endpoint informasi peran dan batasan AI.

**Response:**
```json
{
  "success": true,
  "peran": ["array of allowed roles"],
  "batasan": ["array of restrictions"],
  "catatan": "AI hanya memberikan analisis informatif"
}
```

### Mekanisme Keamanan AI

1. **Validasi Input:** Semua pertanyaan dicek terhadap kata kunci terlarang
2. **System Prompt:** AI diberi instruksi ketat tentang batasan
3. **Rate Limiting:** Pembatasan frekuensi pertanyaan per user
4. **Audit Logging:** Semua interaksi AI dicatat untuk monitoring
5. **Fallback Response:** Jika AI gagal, berikan pesan error informatif

### Contoh Penggunaan

**Pertanyaan Aman:**
- "Apa arti CPU usage 80%?"
- "Jelaskan tren memory server X"
- "Bagaimana cara melihat alert aktif?"

**Pertanyaan Ditolak:**
- "Restart server production"
- "Hapus data metrik lama"
- "Jalankan perintah shutdown"

### Teknologi AI

- **Primary:** OpenAI GPT-3.5-turbo
- **Fallback:** Google Gemini (jika OpenAI unavailable)
- **Local Alternative:** Mock AI untuk development
- **Temperature:** 0.3 (konsisten, tidak kreatif berlebihan)
- **Max Tokens:** 500 per response

### Monitoring AI

- Response time tracking
- Error rate monitoring
- User interaction analytics
- Content safety validation
- API usage monitoring

#### 4. Ringkasan Harian
- **Kapan:** Setiap hari pukul 08:00 WIB
- **Tujuan:** Laporan periodik kondisi semua server
- **Template:** Status semua server user

#### 5. Rekomendasi AI
- **Kapan:** Setiap Senin pukul 09:00 WIB
- **Tujuan:** Saran cerdas berdasarkan analisis performa
- **Template:** Rekomendasi prediktif + action items

#### 6. Reset Password
- **Kapan:** User request reset password
- **Tujuan:** Link reset password
- **Template:** Link reset 1 jam

### Pengaturan Email User

Setiap user dapat mengatur preferensi email di profil:

```javascript
pengaturanEmail: {
  alertKritis: true,        // Alert CPU > 90%, Memory > 95%, Disk > 95%
  alertPeringatan: true,    // Alert CPU > 80%, Memory > 85%, Disk > 85%
  alertRecovery: true,      // Notifikasi recovery server
  frekuensiNotifikasi: 'immediate', // immediate/hourly/daily/weekly
  ringkasanHarian: true,    // Ringkasan harian pukul 08:00
  ringkasanMingguan: true,  // Ringkasan mingguan
  rekomendasiAi: true       // Rekomendasi AI setiap Senin
}
```

### Alur Pengiriman Email

```
1. EVENT TRIGGER
   ├── Server Alert → Evaluasi Kondisi → Kirim Alert Email
   ├── User Registration → Generate Token → Kirim Verifikasi Email
   ├── Daily Schedule → Collect Data → Kirim Ringkasan Harian
   └── Weekly Schedule → AI Analysis → Kirim Rekomendasi AI

2. EMAIL COMPOSITION
   ├── Pilih Template → Isi Data → Generate HTML
   ├── Personalization → User Info → Custom Content
   └── Priority Setting → High untuk Alert → Normal untuk Laporan

3. EMAIL SENDING
   ├── SMTP Connection → Nodemailer → Send Mail
   ├── Queue Management → Rate Limiting → Retry Logic
   └── Logging → Success/Failure → User Statistics

4. DELIVERY TRACKING
   ├── Message ID → Delivery Status → Bounce Handling
   ├── User Statistics → Email Count → Failure Rate
   └── Analytics → Open Rate → Click Rate
```

### Hubungan Email dengan Data Health Server

```
Server Health Data → Alert Engine → AI Analysis → Email Template → User Notification

Data Flow:
├── Real-time Metrics
│   ├── CPU Usage (%) → Threshold: 80% (Warning), 90% (Critical)
│   ├── Memory Usage (%) → Threshold: 85% (Warning), 95% (Critical)
│   ├── Disk Usage (%) → Threshold: 85% (Warning), 95% (Critical)
│   ├── Network I/O → Baseline comparison
│   └── Response Time → SLA compliance
├── Alert Rules Engine
│   ├── Critical: Immediate email + high priority
│   ├── Warning: Email jika user subscribe + normal priority
│   └── Recovery: Email jika user subscribe + normal priority
├── AI Recommendation Engine
│   ├── Pattern Analysis → Trend detection → Predictive alerts
│   ├── Root Cause Analysis → Problem identification → Actionable insights
│   └── Optimization Tips → Performance suggestions → Best practices
└── User Communication
    ├── Email Templates → HTML/CSS → Responsive design
    ├── Personalization → User name → Server names
    └── Scheduling → Time zones → Frequency preferences
```

### Testing Email

Test koneksi email:

```bash
# Via API
curl -X GET http://localhost:5000/api/konfigurasi/test-email

# Via code
const { testKoneksiEmail } = require('./src/konfigurasi/email');
testKoneksiEmail().then(result => console.log(result));
```

### Troubleshooting Email

**Email tidak terkirim:**
1. Cek konfigurasi SMTP di `.env`
2. Verifikasi kredensial email (app password untuk Gmail)
3. Cek firewall dan koneksi internet
4. Lihat log error di console/logs

**Email masuk spam:**
1. Setup SPF, DKIM, DMARC untuk domain
2. Gunakan alamat "From" yang konsisten
3. Hindari kata-kata trigger spam
4. Minta user menambahkan ke whitelist

**Rate limiting:**
- Gmail: 500 email/hari untuk free account
- Outlook: 300 email/hari
- Pertimbangkan upgrade ke business account atau email service provider

## Teknologi Digunakan

- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **NodeMailer** - Email service
- **OpenAI/Gemini API** - AI chatbot
- **bcrypt** - Password hashing
- **Winston** - Logging
- **node-cron** - Scheduled tasks

## Keamanan

- Password di-hash dengan bcrypt
- JWT token dengan expiration
- HTTP-only cookie untuk JWT
- Rate limiting untuk API
- Input validation dan sanitization
- CORS dan Helmet untuk security headers

## Lisensi

ISC