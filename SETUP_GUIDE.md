# 🚀 Server Health Monitoring System - Setup Guide

Aplikasi monitoring kesehatan server real-time dengan AI analysis, alerting otomatis, dan dashboard interaktif.

## 📋 Daftar Isi

- [Deskripsi Aplikasi](#deskripsi-aplikasi)
- [Fitur Utama](#fitur-utama)
- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Kontribusi](#kontribusi)

## 📊 Deskripsi Aplikasi

Sistem monitoring kesehatan server yang komprehensif dengan kemampuan:

- **Real-time Monitoring**: Pemantauan metrik server secara real-time (CPU, Memory, Disk, Network)
- **AI Analysis**: Analisis cerdas untuk deteksi anomali dan predictive maintenance
- **Automated Alerting**: Notifikasi email otomatis untuk kondisi kritis
- **Interactive Dashboard**: Dashboard web dengan visualisasi data real-time
- **Multi-user System**: Sistem autentikasi dengan role-based access control

## ✨ Fitur Utama

### Backend (Node.js/Express)
- ✅ RESTful API dengan dokumentasi lengkap
- ✅ JWT Authentication dengan refresh token
- ✅ WebSocket untuk real-time updates
- ✅ MongoDB database dengan Mongoose ODM
- ✅ Winston logging dengan multiple transports
- ✅ Email notifications dengan Nodemailer
- ✅ Rate limiting dan security middleware
- ✅ Comprehensive testing (Jest + Supertest)

### Frontend (Next.js/React)
- ✅ TypeScript untuk type safety
- ✅ Real-time dashboard dengan Socket.IO
- ✅ Responsive design dengan Tailwind CSS
- ✅ Interactive charts dengan Recharts
- ✅ Form validation dengan React Hook Form + Zod

## 🛠️ Prerequisites

Pastikan sistem Anda memiliki software berikut:

### Required Software
- **Node.js** 18.0 atau lebih tinggi
- **MongoDB** 5.0 atau lebih tinggi
- **npm** atau **yarn** package manager
- **Git** untuk version control

### System Requirements
- **RAM**: Minimum 4GB (recommended 8GB)
- **Storage**: Minimum 2GB free space
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Verifikasi Instalasi
```bash
# Cek versi Node.js
node --version
# Output: v18.0.0 atau lebih tinggi

# Cek versi npm
npm --version
# Output: 8.0.0 atau lebih tinggi

# Cek MongoDB (jika menggunakan local)
mongod --version
# Output: db version v5.0.0 atau lebih tinggi
```

## 📦 Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd fix_final_project
```

### 2. Setup Backend
```bash
# Masuk ke direktori backend
cd backend

# Install dependencies
npm install

# Verifikasi instalasi
npm list --depth=0
```

### 3. Setup Frontend
```bash
# Masuk ke direktori frontend
cd ../frontend

# Install dependencies
npm install

# Verifikasi instalasi
npm list --depth=0
```

### 4. Setup Database
```bash
# Untuk MongoDB lokal
mongod

# Atau gunakan MongoDB Atlas (cloud)
# Update MONGODB_URI di file .env
```

## ⚙️ Konfigurasi Environment

### Backend Environment Variables

Buat file `.env` di direktori `backend/`:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/monitoring-server
# Atau untuk MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/monitoring-server

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters

# Email Configuration (untuk Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Server Configuration
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Logging Configuration
LOG_LEVEL=info

# AI Configuration (jika menggunakan OpenAI)
OPENAI_API_KEY=your-openai-api-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

Buat file `.env.local` di direktori `frontend/`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Socket.IO Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001

# Environment
NODE_ENV=development
```

### Generate JWT Secrets

Untuk keamanan, generate JWT secrets yang kuat:

```bash
# Menggunakan Node.js untuk generate random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Menjalankan Aplikasi

### Development Mode

#### 1. Jalankan Backend
```bash
cd backend

# Development mode dengan auto-reload
npm run dev

# Atau mode production
npm start
```

Backend akan berjalan di: `http://localhost:5001`

#### 2. Jalankan Frontend
```bash
cd frontend

# Development mode dengan auto-reload
npm run dev

# Atau build dan jalankan production
npm run build
npm start
```

Frontend akan berjalan di: `http://localhost:3000`

#### 3. Jalankan Database
```bash
# Jika menggunakan MongoDB lokal
mongod

# Atau pastikan MongoDB Atlas connection string benar
```

### Production Mode

#### Build Frontend
```bash
cd frontend
npm run build
npm start
```

#### Build Backend
```bash
cd backend
npm start
```

### Menggunakan Docker (Optional)

Jika menggunakan Docker:

```bash
# Build dan jalankan dengan Docker Compose
docker-compose up --build

# Atau jalankan secara terpisah
docker build -t monitoring-backend ./backend
docker build -t monitoring-frontend ./frontend
```

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Jalankan semua test dengan coverage
npm test

# Jalankan unit test saja
npm run test:unit

# Jalankan integration test saja
npm run test:integration

# Jalankan test dalam mode watch
npm run test:watch
```

### Frontend Testing
```bash
cd frontend

# Jalankan test (jika ada)
npm test

# Jalankan linting
npm run lint

# Type checking
npm run type-check
```

### Manual Testing

#### Test API Endpoints
```bash
# Test health check
curl http://localhost:5001/api/health

# Test authentication
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

#### Test WebSocket Connection
```javascript
// Di browser console
const socket = io('http://localhost:5001');
socket.on('connect', () => console.log('Connected!'));
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "namaPengguna": "johndoe",
  "email": "john@example.com",
  "kataSandi": "Password123",
  "konfirmasiKataSandi": "Password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "kataSandi": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "namaPengguna": "johndoe",
      "email": "john@example.com",
      "peran": "user"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 900
    }
  }
}
```

### Server Monitoring Endpoints

#### Get All Servers
```http
GET /api/servers
Authorization: Bearer <access_token>
```

#### Get Server Metrics
```http
GET /api/servers/:serverId/metrics?period=1h
Authorization: Bearer <access_token>
```

#### Create New Server
```http
POST /api/servers
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "nama": "Production Web Server",
  "jenisServer": "web",
  "ipAddress": "192.168.1.100",
  "port": 80,
  "statusAktif": true
}
```

### Alert System Endpoints

#### Get Active Alerts
```http
GET /api/alerts/active
Authorization: Bearer <access_token>
```

#### Create Alert Rule
```http
POST /api/alerts/rules
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "serverId": "server_id",
  "parameter": "cpu",
  "operator": ">",
  "threshold": 80,
  "severity": "warning",
  "enabled": true
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: MongoServerError: bad auth Authentication failed
```

**Solution:**
- Periksa `MONGODB_URI` di file `.env`
- Pastikan MongoDB service sedang berjalan
- Verifikasi username dan password

#### 2. JWT Token Invalid
```
Error: JsonWebTokenError: invalid signature
```

**Solution:**
- Pastikan `JWT_SECRET` sama di semua environment
- Regenerate token jika secret berubah
- Periksa token expiration

#### 3. Email Not Sending
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solution:**
- Gunakan App Password untuk Gmail
- Periksa pengaturan SMTP
- Verifikasi firewall tidak block port 587

#### 4. Frontend Build Error
```
Error: Cannot resolve module 'socket.io-client'
```

**Solution:**
- Jalankan `npm install` di direktori frontend
- Hapus `node_modules` dan `package-lock.json`, lalu install ulang
- Periksa versi Node.js compatibility

#### 5. WebSocket Connection Failed
```
WebSocket connection to 'ws://localhost:5001/' failed
```

**Solution:**
- Pastikan backend sedang berjalan
- Periksa CORS settings
- Verifikasi firewall settings

### Debug Mode

#### Enable Debug Logging
```bash
# Backend
LOG_LEVEL=debug npm run dev

# Frontend
DEBUG=* npm run dev
```

#### Check Application Health
```bash
# Health check endpoint
curl http://localhost:5001/api/health

# Database connection check
curl http://localhost:5001/api/health/database
```

### Performance Issues

#### Memory Usage High
- Monitor dengan `process.memoryUsage()`
- Check untuk memory leaks
- Implement connection pooling

#### Slow Response Times
- Enable database query logging
- Check network latency
- Optimize database queries dengan indexes

## 🚢 Deployment

### Environment Setup

#### 1. Production Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:prod-pass@cluster.mongodb.net/prod-db
JWT_SECRET=production-secret-key-32-chars-minimum
EMAIL_HOST=smtp.production.com
PORT=5001
```

#### 2. Build Applications
```bash
# Backend
cd backend
npm run build  # Jika ada build step
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Docker Deployment

#### Dockerfile.backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

#### Dockerfile.frontend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/monitoring
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5001/api

  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Cloud Deployment Options

#### Vercel (Frontend)
```bash
npm i -g vercel
cd frontend
vercel --prod
```

#### Railway/Heroku (Backend)
```bash
# Heroku
heroku create your-app-name
git push heroku main

# Railway
railway login
railway link
railway up
```

## 🤝 Kontribusi

### Development Workflow

1. **Fork** repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

### Code Standards

#### Backend
```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Testing
npm test
```

#### Frontend
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build check
npm run build
```

### Commit Message Convention
```
feat: add new monitoring endpoint
fix: resolve websocket connection issue
docs: update API documentation
style: format code with prettier
refactor: split large controller into services
test: add unit tests for auth service
```

## 📞 Support

### Getting Help

1. **Check Documentation**: README.md dan file markdown lainnya
2. **Search Issues**: GitHub Issues untuk masalah serupa
3. **Create Issue**: Jika masalah belum ada solusinya
4. **Community**: Diskusi di GitHub Discussions

### System Information untuk Bug Reports

Sertakan informasi berikut saat melaporkan bug:

```
OS: Windows 11
Node.js: v18.17.0
npm: 9.6.7
MongoDB: v5.0.15
Browser: Chrome 119.0.6045.105
Error Message: [error description]
Steps to Reproduce: [detailed steps]
Expected Behavior: [what should happen]
Actual Behavior: [what actually happens]
```

---

## 🎯 Quick Start Checklist

- [ ] Clone repository
- [ ] Install backend dependencies (`cd backend && npm install`)
- [ ] Install frontend dependencies (`cd frontend && npm install`)
- [ ] Setup `.env` files (backend dan frontend)
- [ ] Start MongoDB service
- [ ] Run backend (`cd backend && npm run dev`)
- [ ] Run frontend (`cd frontend && npm run dev`)
- [ ] Open browser ke `http://localhost:3000`
- [ ] Test login dengan credentials default

**Selamat menggunakan Server Health Monitoring System! 🚀**