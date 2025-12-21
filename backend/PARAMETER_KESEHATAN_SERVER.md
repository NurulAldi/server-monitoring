# Parameter Kesehatan Server Monitoring

Berikut adalah parameter kesehatan server yang akan dimonitor dalam aplikasi monitoring server akademik. Parameter ini dipilih berdasarkan relevansi teknis, kemampuan simulasi logis, dan kemudahan pemahaman untuk dosen non-sysadmin.

## 1. **Penggunaan CPU (CPU Usage)**

### Nama Parameter
Penggunaan CPU

### Arti Teknisnya
Persentase waktu CPU digunakan untuk menjalankan proses dalam periode tertentu. CPU adalah "otak" server yang menjalankan semua perintah dan kalkulasi.

### Rentang Nilai Normal
- **Normal**: 0% - 60%
- **Warning**: 61% - 80%
- **Critical**: > 80%

### Indikasi Bermasalah
- **Warning (61-80%)**: Server mulai sibuk, mungkin ada aplikasi yang menggunakan banyak sumber daya
- **Critical (>80%)**: Server overload, risiko aplikasi lambat atau crash, perlu intervensi segera

---

## 2. **Penggunaan Memori (Memory Usage)**

### Nama Parameter
Penggunaan Memori

### Arti Teknisnya
Persentase memori RAM (Random Access Memory) yang digunakan untuk menyimpan data sementara yang sedang diproses. RAM seperti "meja kerja" server untuk tugas sehari-hari.

### Rentang Nilai Normal
- **Normal**: 0% - 70%
- **Warning**: 71% - 85%
- **Critical**: > 85%

### Indikasi Bermasalah
- **Warning (71-85%)**: Memori mulai penuh, aplikasi mungkin mulai lambat
- **Critical (>85%)**: Risiko out-of-memory, aplikasi bisa crash atau server tidak responsif

---

## 3. **Penggunaan Disk (Disk Usage)**

### Nama Parameter
Penggunaan Disk

### Arti Teknisnya
Persentase ruang penyimpanan disk yang telah terisi. Disk adalah "lemari arsip" server untuk menyimpan file, database, dan aplikasi secara permanen.

### Rentang Nilai Normal
- **Normal**: 0% - 80%
- **Warning**: 81% - 90%
- **Critical**: > 90%

### Indikasi Bermasalah
- **Warning (81-90%)**: Ruang disk mulai terbatas, perlu monitoring penggunaan
- **Critical (>90%)**: Risiko disk penuh, aplikasi tidak bisa menyimpan data, server bisa berhenti berfungsi

---

## 4. **Latensi Jaringan (Network Latency)**

### Nama Parameter
Latensi Jaringan

### Arti Teknisnya
Waktu respons (dalam milidetik) yang dibutuhkan untuk mengirim dan menerima data melalui jaringan. Latensi seperti "jarak waktu" antara server dan pengguna.

### Rentang Nilai Normal
- **Normal**: 0 - 100 ms
- **Warning**: 101 - 500 ms
- **Critical**: > 500 ms

### Indikasi Bermasalah
- **Warning (101-500ms)**: Jaringan mulai lambat, pengguna mungkin merasakan delay
- **Critical (>500ms)**: Jaringan sangat lambat, aplikasi online tidak bisa digunakan dengan baik

---

## 5. **Beban Sistem (System Load Average)**

### Nama Parameter
Beban Sistem

### Arti Teknisnya
Rata-rata jumlah proses yang menunggu untuk dijalankan CPU dalam periode waktu tertentu. Load average seperti "antrian kerja" yang menunggu CPU.

### Rentang Nilai Normal
- **Normal**: 0 - 2.0 (per core CPU)
- **Warning**: 2.1 - 4.0 (per core CPU)
- **Critical**: > 4.0 (per core CPU)

### Indikasi Bermasalah
- **Warning (2.1-4.0)**: Ada antrian proses, sistem mulai overburden
- **Critical (>4.0)**: Banyak proses menunggu, server sangat lambat atau tidak responsif

---

## 6. **Kecepatan Jaringan (Network Throughput)**

### Nama Parameter
Kecepatan Jaringan

### Arti Teknisnya
Kecepatan transfer data melalui jaringan dalam Mbps (Mega bits per second). Throughput seperti "lebar jalan" untuk lalu lintas data.

### Rentang Nilai Normal
- **Normal**: > 10 Mbps (download/upload)
- **Warning**: 1 - 10 Mbps
- **Critical**: < 1 Mbps

### Indikasi Bermasalah
- **Warning (1-10 Mbps)**: Kecepatan terbatas, transfer file besar akan lambat
- **Critical (<1 Mbps)**: Kecepatan sangat rendah, koneksi internet bermasalah

---

## 7. **Paket Hilang Jaringan (Packet Loss)**

### Nama Parameter
Paket Hilang Jaringan

### Arti Teknisnya
Persentase paket data yang hilang atau tidak sampai tujuan saat transfer melalui jaringan. Packet loss seperti "surat yang hilang" dalam pengiriman.

### Rentang Nilai Normal
- **Normal**: 0% - 1%
- **Warning**: 1.1% - 5%
- **Critical**: > 5%

### Indikasi Bermasalah
- **Warning (1.1-5%)**: Ada gangguan jaringan, beberapa data tidak sampai
- **Critical (>5%)**: Jaringan bermasalah parah, koneksi tidak stabil

---

## 8. **Waktu Aktif Server (Server Uptime)**

### Nama Parameter
Waktu Aktif Server

### Arti Teknisnya
Total waktu server telah berjalan tanpa restart sejak terakhir kali dinyalakan. Uptime seperti "jam kerja" server tanpa istirahat.

### Rentang Nilai Normal
- **Normal**: > 30 hari
- **Warning**: 7 - 30 hari
- **Critical**: < 7 hari

### Indikasi Bermasalah
- **Warning (7-30 hari)**: Server perlu restart rutin, mungkin ada masalah stabilitas
- **Critical (<7 hari)**: Server sering crash, ada masalah serius yang perlu diperbaiki

---

## 9. **Jumlah Proses Aktif (Active Processes)**

### Nama Parameter
Jumlah Proses Aktif

### Arti Teknisnya
Jumlah aplikasi/program yang sedang berjalan di server. Proses seperti "pekerja" yang menjalankan tugas-tugas di server.

### Rentang Nilai Normal
- **Normal**: 50 - 200 proses
- **Warning**: 201 - 500 proses
- **Critical**: > 500 proses

### Indikasi Bermasalah
- **Warning (201-500)**: Banyak aplikasi berjalan, perlu cek apakah semua diperlukan
- **Critical (>500)**: Terlalu banyak proses, server overburden, risiko crash

---

## 10. **Koneksi Jaringan Aktif (Active Network Connections)**

### Nama Parameter
Koneksi Jaringan Aktif

### Arti Teknisnya
Jumlah koneksi jaringan aktif yang terhubung ke server. Connections seperti "jalur komunikasi" antara server dan pengguna/aplikasi lain.

### Rentang Nilai Normal
- **Normal**: 10 - 100 koneksi
- **Warning**: 101 - 500 koneksi
- **Critical**: > 500 koneksi

### Indikasi Bermasalah
- **Warning (101-500)**: Traffic tinggi, server sibuk melayani banyak pengguna
- **Critical (>500)**: Risiko overload, server mungkin tidak bisa menangani semua koneksi

---

## Implementasi dalam Kode

Parameter-parameter ini telah diimplementasikan dalam model `Metrik.js` dengan struktur data yang lengkap dan threshold yang dapat dikonfigurasi melalui `konstanta.js`.

### Threshold Default
```javascript
const THRESHOLD_DEFAULT = {
  CPU_WARNING: 60, CPU_CRITICAL: 80,
  MEMORI_WARNING: 70, MEMORI_CRITICAL: 85,
  DISK_WARNING: 80, DISK_CRITICAL: 90,
  LATENSI_WARNING: 100, LATENSI_CRITICAL: 500
};
```

### Simulasi Logis
Semua parameter dapat disimulasikan dengan logika matematis:
- **CPU/Memory/Disk**: Persentase acak dengan variasi waktu
- **Network**: Simulasi latency dan throughput berdasarkan kondisi
- **Load Average**: Berdasarkan CPU usage dan jumlah proses
- **Uptime**: Counter waktu sejak "startup"
- **Connections**: Random dalam rentang normal dengan spike

Parameter ini dirancang untuk memberikan pemahaman yang jelas tentang kesehatan server tanpa memerlukan pengetahuan teknis mendalam, sehingga cocok untuk dosen yang bukan ahli sistem administrasi.