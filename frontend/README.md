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
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint check
- `npm run type-check` - TypeScript check