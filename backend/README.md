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