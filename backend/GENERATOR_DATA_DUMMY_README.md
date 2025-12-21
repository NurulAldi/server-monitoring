# Generator Data Dummy Health Server

Implementasi mekanisme generator data simulasi kesehatan server yang realistis untuk sistem monitoring akademik.

## 🎯 **Fitur Utama**

### **1. State Machine Kondisi Server**
- **Normal**: Kondisi stabil dengan variasi natural
- **Warning**: Kondisi waspada dengan trend meningkat
- **Critical**: Kondisi kritis dengan performa buruk
- **Transisi Realistis**: Berdasarkan threshold dan durasi minimum

### **2. Pola Perubahan Data**
- **Trend**: Perubahan gradual berdasarkan kondisi
- **Spike**: Lonjakan mendadak (5% probability per interval)
- **Seasonal**: Pola harian dan mingguan
- **Noise**: Variasi acak terkontrol (±5-10%)

### **3. Dependency Antar Parameter**
- **CPU ↔ Load Average**: CPU tinggi = Load tinggi
- **Memory ↔ Processes**: Proses banyak = Memory tinggi
- **Network ↔ Connections**: Koneksi banyak = Latensi tinggi
- **Disk ↔ Uptime**: Disk penuh = Restart sering

### **4. Historical Context**
- **Baseline History**: Moving average 24 jam
- **Trend Analysis**: Deteksi pola kenaikan/penurunan
- **State Persistence**: Kondisi tidak bolak-balik cepat

## 🔧 **Implementasi Teknis**

### **Kelas KondisiServer**
```javascript
class KondisiServer {
  constructor(serverId) {
    this.serverId = serverId;
    this.kondisi = 'NORMAL';
    this.baseline = this.getBaselineAwal();
    this.trend = { cpu: 0, memori: 0, disk: 0.001, latensi: 0 };
  }
}
```

### **Kelas GeneratorDataMetrik**
```javascript
class GeneratorDataMetrik {
  constructor() {
    this.serverStates = new Map();
    this.baselineHistory = new Map();
  }

  async generateDataMetrik(serverId) {
    // Generate metrics berdasarkan kondisi
    // Simpan ke database
    // Update state dan history
  }
}
```

### **Penjadwal Periodik**
- **Interval**: Setiap 60 detik (cron: `*/1 * * * *`)
- **Batch Processing**: Generate untuk semua server aktif
- **Error Handling**: Continue processing jika satu server gagal
- **Logging**: Detail aktivitas dan error

## 📊 **Parameter yang Dihasilkan**

### **1. CPU Usage (%)**
- **Normal**: 10-50%
- **Warning**: 60-80%
- **Critical**: 85-100%
- **Trend**: ±0.5% per menit

### **2. Memory Usage (%)**
- **Normal**: 30-60%
- **Warning**: 70-85%
- **Critical**: 90-100%
- **Trend**: ±0.3% per menit

### **3. Disk Usage (%)**
- **Normal**: 40-70%
- **Warning**: 80-90%
- **Critical**: 95-100%
- **Trend**: +0.1% per jam (growth)

### **4. Network Latency (ms)**
- **Normal**: 5-50ms
- **Warning**: 100-300ms
- **Critical**: 500-2000ms
- **Trend**: ±2ms per menit

### **5. System Load Average**
- **Normal**: 0.5-1.5 per core
- **Warning**: 2.0-3.5 per core
- **Critical**: 4.0-8.0 per core
- **Trend**: Mengikuti CPU

### **6. Network Throughput (Mbps)**
- **Normal**: 50-100 Mbps
- **Warning**: 20-50 Mbps
- **Critical**: 1-10 Mbps
- **Trend**: ±5 Mbps per menit

### **7. Packet Loss (%)**
- **Normal**: 0-0.5%
- **Warning**: 1-3%
- **Critical**: 5-20%
- **Trend**: ±0.1% per menit

### **8. Server Uptime (detik)**
- **Normal**: Counter terus bertambah
- **Restart**: 5% chance per hari simulasi
- **Recovery**: 5 menit - 1 jam setelah restart

### **9. Active Processes**
- **Normal**: 80-150
- **Warning**: 150-300
- **Critical**: 300-800
- **Trend**: Mengikuti memory

### **10. Active Connections**
- **Normal**: 20-80
- **Warning**: 80-200
- **Critical**: 200-1000
- **Trend**: ±10 koneksi per menit

## 🎲 **Algoritma Pembuatan Data**

### **1. Base Value Generation**
```javascript
function generateMetrics(kondisiServer, spikeActive) {
  const kondisi = kondisiServer.kondisi;
  let cpuBase, memoriBase, diskBase, latensiBase;

  if (kondisi === 'NORMAL') {
    cpuBase = randomBetween(10, 50);
    memoriBase = randomBetween(30, 60);
    // ... other parameters
  }
  // ... similar for WARNING and CRITICAL
}
```

### **2. Trend Application**
```javascript
cpuBase += kondisiServer.trend.cpu;
memoriBase += kondisiServer.trend.memori;
latensiBase += kondisiServer.trend.latensi;
```

### **3. Spike Events**
```javascript
if (spikeActive) {
  const spikeMultiplier = randomBetween(1.2, 1.5);
  cpuBase *= spikeMultiplier;
  memoriBase *= spikeMultiplier;
  // ... apply to other parameters
}
```

### **4. Seasonal Adjustment**
```javascript
const jam = new Date().getHours();
if (jam >= 8 && jam <= 18) { // Business hours
  cpuBase *= 1.2;    // 20% higher
  memoriBase *= 1.1; // 10% higher
  connectionsBase *= 1.5; // 50% higher
}
```

### **5. Random Noise**
```javascript
const noise = 0.05; // 5% noise
cpuBase += cpuBase * (Math.random() - 0.5) * noise * 2;
```

### **6. Correlation Application**
```javascript
if (cpuBase > 70) {
  memoriBase = Math.min(100, memoriBase + randomBetween(5, 15));
}
```

## 🔄 **State Machine Kondisi**

### **Transisi Kondisi**
```
NORMAL → WARNING (healthScore > 70)
WARNING → CRITICAL (healthScore > 85)
WARNING → NORMAL (healthScore < 40 && 10+ minutes)
CRITICAL → WARNING (healthScore < 60 && 15+ minutes)
CRITICAL → NORMAL (healthScore < 30 && 30+ minutes)
```

### **Health Score Calculation**
```javascript
function hitungSkorKesehatan(metrics) {
  let skor = 0;
  if (metrics.cpu > THRESHOLD_DEFAULT.CPU_CRITICAL) skor += 30;
  if (metrics.memori > THRESHOLD_DEFAULT.MEMORI_CRITICAL) skor += 25;
  if (metrics.disk > THRESHOLD_DEFAULT.DISK_CRITICAL) skor += 20;
  if (metrics.latensi > THRESHOLD_DEFAULT.LATENSI_CRITICAL) skor += 15;
  // ... other parameters
  return skor;
}
```

## 📈 **Baseline & Historical Context**

### **Moving Average Baseline**
- **Window**: 24 jam terakhir
- **Update**: Setiap generate data baru
- **Usage**: Referensi untuk trend analysis

### **Trend Calculation**
```javascript
updateTrend() {
  const jam = new Date().getHours();
  const hari = new Date().getDay();

  const seasonalFactor = (hari >= 1 && hari <= 5 && jam >= 8 && jam <= 18) ? 1.5 : 1.0;

  if (this.kondisi === 'NORMAL') {
    this.trend.cpu = randomBetween(-0.5, 0.5) * seasonalFactor;
    // ... other trends
  }
  // ... similar for WARNING and CRITICAL
}
```

## 🧪 **Testing & Validation**

### **Unit Testing**
```javascript
// Test kondisi normal
const result = await generateDataMetrikServer(serverId);
assert(result.data.cpu.persentase).toBeGreaterThanOrEqual(10);
assert(result.data.cpu.persentase).toBeLessThanOrEqual(50);

// Test state transition
forceServerCondition(serverId, 'CRITICAL');
const criticalResult = await generateDataMetrikServer(serverId);
assert(criticalResult.data.cpu.persentase).toBeGreaterThanOrEqual(85);
```

### **Integration Testing**
```javascript
// Test batch generation
const batchResult = await generateDataSemuaServer();
assert(batchResult.totalServers).toBeGreaterThan(0);
assert(batchResult.results.length).toBe(batchResult.totalServers);

// Test scheduler
inisialisasiPenjadwal();
// Wait for cron job execution
// Verify data generated in database
```

### **Performance Testing**
- **Load Test**: Generate untuk 100+ server simultaneously
- **Memory Test**: Monitor memory usage selama 24 jam simulasi
- **Database Test**: Verify no performance degradation

## 🚀 **Penggunaan**

### **Generate untuk Satu Server**
```javascript
const { generateDataMetrikServer } = require('./layanan/layananGeneratorData');

const result = await generateDataMetrikServer('serverId123');
console.log('Generated metrics:', result.data);
```

### **Generate untuk Semua Server**
```javascript
const { generateDataSemuaServer } = require('./layanan/layananGeneratorData');

const result = await generateDataSemuaServer();
console.log(`Generated for ${result.totalServers} servers`);
```

### **Force Kondisi untuk Testing**
```javascript
const { forceServerCondition } = require('./layanan/layananGeneratorData');

// Force server ke kondisi critical
forceServerCondition('serverId123', 'CRITICAL');
```

### **Reset State Server**
```javascript
const { resetServerState } = require('./layanan/layananGeneratorData');

// Reset state untuk testing ulang
resetServerState('serverId123');
```

## 📋 **Konfigurasi**

### **Threshold dalam konstanta.js**
```javascript
const THRESHOLD_DEFAULT = {
  CPU_WARNING: 60, CPU_CRITICAL: 80,
  MEMORI_WARNING: 70, MEMORI_CRITICAL: 85,
  DISK_WARNING: 80, DISK_CRITICAL: 90,
  LATENSI_WARNING: 100, LATENSI_CRITICAL: 500
};
```

### **Interval dalam konstanta.js**
```javascript
const INTERVAL_GENERATOR = {
  DEFAULT: 60,    // 60 detik
  MINIMUM: 10,    // Minimum 10 detik
  MAXIMUM: 300    // Maximum 5 menit
};
```

## 🔍 **Monitoring & Debugging**

### **Logging**
- **System Logs**: Aktivitas generator dan scheduler
- **Error Logs**: Failures dan exceptions
- **Performance Logs**: Durasi generation dan resource usage

### **Metrics Validation**
- **Range Check**: Verify semua metrics dalam range valid
- **Correlation Check**: Verify dependency antar parameter
- **Trend Check**: Monitor pola perubahan over time

### **Database Verification**
```javascript
// Query recent metrics
const recentMetrics = await Metrik.find({
  timestampPengumpulan: { $gte: new Date(Date.now() - 60000) } // Last minute
});

console.log(`Generated ${recentMetrics.length} metrics in last minute`);
```

## 🎯 **Keunggulan Implementasi**

1. **Realistis**: Data mengikuti pola server nyata
2. **Kontrollable**: Mudah force kondisi untuk testing
3. **Scalable**: Mendukung banyak server simultaneously
4. **Maintainable**: Kode terstruktur dengan separation of concerns
5. **Observable**: Comprehensive logging dan monitoring
6. **Configurable**: Threshold dan interval dapat dikonfigurasi
7. **Resilient**: Error handling yang baik, continue on failure

Implementasi ini menghasilkan data simulasi yang cukup realistis untuk keperluan development, testing, dan demonstrasi sistem monitoring server, namun tetap predictable dan controllable untuk keperluan debugging dan validation.