# Template Email Alert Server Bermasalah

Template email notifikasi komprehensif untuk kondisi server bermasalah dengan bahasa Indonesia formal-akademik.

## Fitur Template

### 🎯 Komponen Utama
- **Identitas Pengguna**: Menampilkan nama dan email penerima
- **Ringkasan Kondisi Server**: Informasi dasar server dan waktu deteksi
- **Penjelasan Masalah**: Deskripsi detail kondisi bermasalah
- **Metrik Real-time**: Visualisasi data performa saat alert
- **Rekomendasi AI**: Saran cerdas berdasarkan analisis otomatis
- **Action Buttons**: Link langsung ke dashboard dan detail server

### 🎨 Desain & UX
- **Responsive Design**: Kompatibel dengan desktop dan mobile
- **Color Coding**: Warna berbeda untuk level CRITICAL dan WARNING
- **Visual Hierarchy**: Layout yang jelas dan mudah dibaca
- **Professional Styling**: Menggunakan font dan spacing yang profesional

### 🌐 Bahasa & Tone
- **Bahasa Indonesia Formal-Akademik**: Cocok untuk lingkungan pendidikan/universitas
- **Tone Profesional**: Komunikasi yang sopan dan informatif
- **Terminologi Teknis**: Penjelasan teknis yang mudah dipahami

## Struktur Data

```javascript
const dataAlert = {
  user: {
    _id: 'string',
    namaPengguna: 'string',
    email: 'string'
  },
  server: {
    _id: 'string',
    nama: 'string',
    jenisServer: 'string'
  },
  metrics: {
    cpu: number,      // persentase
    memori: number,   // persentase
    disk: number,     // persentase
    jaringan: {
      downloadMbps: number,
      uploadMbps: number,
      latensiMs: number
    }
  },
  level: 'CRITICAL' | 'WARNING',
  masalah: string[],  // array masalah yang terdeteksi
  penjelasanMasalah: string,
  rekomendasiAI: string,  // HTML string (optional)
  waktuAlert: Date,
  dashboardUrl: string   // (optional)
};
```

## Penggunaan

```javascript
const { kirimEmailAlertServer } = require('./layanan/layananEmail');

// Kirim email alert
const hasil = await kirimEmailAlertServer(
  'penerima@email.com',
  dataAlert
);
```

## Contoh Output

### Subject Email
```
[Monitoring Server] ALERT KRITIS - Server Database Utama: Kondisi Server Bermasalah
```

### Preview Konten
- Header dengan level alert (KRITIS/PERINGATAN)
- Identitas penerima lengkap
- Ringkasan kondisi server dengan timestamp
- Detail masalah dalam format terstruktur
- Grid metrik dengan color coding
- Section rekomendasi AI dengan formatting kaya
- Action buttons untuk navigasi cepat

## Kustomisasi

### Mengubah Styling
Edit fungsi `templateEmailAlertServerBermasalah()` di `src/konfigurasi/email.js`

### Menambah Field Baru
1. Update parameter fungsi template
2. Update struktur HTML di template
3. Update JSDoc dan dokumentasi

### Mengubah Bahasa
Template menggunakan bahasa Indonesia formal. Untuk bahasa lain, buat template baru dengan struktur serupa.

## Testing

Gunakan file `contoh_email_alert.js` untuk testing template:

```bash
node contoh_email_alert.js
```

## Integrasi dengan Sistem Alert

Template ini terintegrasi dengan:
- **Sistem Alert**: Model Alert.js
- **Layanan Email**: layananEmail.js
- **AI Recommendation**: layananAi.js (placeholder)
- **Dashboard**: Frontend monitoring

## Best Practices

1. **Personalization**: Selalu sertakan identitas user
2. **Context**: Berikan penjelasan yang jelas tentang masalah
3. **Actionable**: Sertakan rekomendasi yang bisa langsung ditindaklanjuti
4. **Responsive**: Pastikan email terlihat baik di semua device
5. **Professional**: Gunakan bahasa yang sesuai dengan audience

## Troubleshooting

### Email Tidak Terkirim
- Periksa konfigurasi SMTP di `konfigurasi/email.js`
- Verifikasi kredensial email
- Cek log error di sistem

### Template Tidak Render dengan Baik
- Pastikan semua parameter terisi
- Periksa struktur data metrics
- Validasi HTML output

### Styling Tidak Konsisten
- Gunakan CSS inline untuk kompatibilitas email client
- Test di berbagai email client (Gmail, Outlook, dll)