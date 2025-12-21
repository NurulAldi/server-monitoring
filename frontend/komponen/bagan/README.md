# Komponen Chart Visualisasi Data Health Server

Folder ini berisi komponen chart untuk visualisasi data kesehatan server dalam tema dark tech modern. Semua komponen menggunakan Recharts dengan integrasi penuh ke dalam sistem monitoring.

## Daftar Komponen Chart

### 1. ChartCPU (`ChartCPU.tsx`)
**Tipe Chart:** Area Chart dengan Gradient Fill
**Data:** CPU Usage, Threshold Lines, Real-time Indicators
**Fitur:**
- Area chart dengan gradient fill untuk CPU usage
- Reference lines untuk threshold (warning/critical)
- Real-time status indicators
- Color-coded status system
- Mock data untuk demonstrasi

### 2. ChartMemory (`ChartMemory.tsx`)
**Tipe Chart:** Donut Chart + Stacked Area Chart
**Data:** Memory Usage (Used, Cached, Buffers, Free)
**Fitur:**
- Donut chart untuk current memory distribution
- Stacked area chart untuk historical trends
- Memory breakdown by type
- Utilization percentage display
- Responsive dual-mode visualization

### 3. ChartNetwork (`ChartNetwork.tsx`)
**Tipe Chart:** Dual-axis Line Chart
**Data:** Upload/Download Bandwidth, Packets, Errors
**Fitur:**
- Dual-axis untuk bandwidth dan packet data
- Upload/download bandwidth visualization
- Packet rate monitoring (optional)
- Error indicators
- Network utilization thresholds

### 4. ChartDisk (`ChartDisk.tsx`)
**Tipe Chart:** Composed Chart (Area + Line)
**Data:** Disk Usage, I/O Speed, IOPS
**Fitur:**
- Stacked area untuk used/available space
- I/O speed lines (read/write)
- IOPS monitoring (optional)
- Storage utilization alerts
- Performance metrics

### 5. ChartLoad (`ChartLoad.tsx`)
**Tipe Chart:** Multi-line Chart
**Data:** System Load Averages (1min, 5min, 15min)
**Fitur:**
- Three load average lines
- CPU count-based thresholds
- Area fill option
- Load percentage calculation
- Trend analysis

### 6. ChartTemperature (`ChartTemperature.tsx`)
**Tipe Chart:** Stacked Area Chart + Gauge
**Data:** CPU, GPU, Motherboard, Disk Temperatures
**Fitur:**
- Multi-component temperature tracking
- Visual temperature gauge
- Threshold-based color coding
- Daily variation patterns
- Critical temperature alerts

### 7. ChartResponseTime (`ChartResponseTime.tsx`)
**Tipe Chart:** Scatter Plot + Line Chart
**Data:** API Response Times, Request Counts, Errors
**Fitur:**
- Scatter plot untuk response time distribution
- Trend line untuk moving averages
- Performance thresholds
- Error rate correlation
- Endpoint monitoring

### 8. ChartErrorRate (`ChartErrorRate.tsx`)
**Tipe Chart:** Stacked Area Chart
**Data:** Error Rates by Type (4xx, 5xx, Timeout, Network)
**Fitur:**
- Error rate trends
- Error type breakdown
- Success rate calculation
- SLA compliance monitoring
- Error distribution analysis

### 9. ChartUptime (`ChartUptime.tsx`)
**Tipe Chart:** Circular Progress + Line Chart
**Data:** Service Uptime, Downtime, Incidents, MTTR
**Fitur:**
- Circular progress indicator
- Uptime percentage tracking
- SLA target visualization
- Incident tracking
- Mean Time To Recovery (MTTR)

### 10. ChartConnections (`ChartConnections.tsx`)
**Tipe Chart:** Line Chart + Real-time Counter
**Data:** Active Connections, Connection Rates
**Fitur:**
- Real-time connection counter
- Connection rate monitoring
- Utilization percentage
- Growth/decline indicators
- Connection health status

## Tema Dark Tech Modern

Semua komponen menggunakan:
- **Color Palette:** Electric cyan (#00FF88), neon orange (#FF6B00), matrix green, cyberpunk accents
- **CSS Variables:** Custom properties untuk konsistensi tema
- **Animations:** Smooth transitions dan real-time indicators
- **Typography:** Hierarchical text sizing dengan glow effects
- **Status Colors:** Online (green), warning (orange), critical (red), accent colors

## Props dan Konfigurasi

### Common Props
- `data?: T[]` - Custom data array (opsional, menggunakan mock data jika tidak disediakan)
- `height?: number` - Chart height (default: 300px)
- `maxValue?: number` - Maximum value untuk scaling

### Chart-specific Props
- `showArea?: boolean` - Toggle area fill untuk line charts
- `showGPU?: boolean` - Include GPU temperature (ChartTemperature)
- `showPackets?: boolean` - Show packet data (ChartNetwork)
- `showIOPS?: boolean` - Show IOPS metrics (ChartDisk)
- `showRate?: boolean` - Show connection rates (ChartConnections)

## Data Structures

Setiap komponen mendefinisikan interface TypeScript untuk data:
```typescript
interface DataCPU {
  waktu: string
  usage: number
  timestamp: number
}
```

## Mock Data

Semua komponen menyediakan mock data realistis untuk demonstrasi:
- **Realistic Patterns:** Daily cycles, occasional spikes, gradual trends
- **Time Series:** 60 data points dengan interval yang sesuai
- **Status Simulation:** Normal operation dengan periodic alerts
- **Performance:** Optimized untuk real-time updates

## Integration dengan Dashboard

Komponen diintegrasikan ke `app/dashboard/page.tsx` dalam grid layout:
- **System Performance:** CPU, Memory
- **Network & Storage:** Network I/O, Disk Usage
- **System Health:** Load, Temperature
- **Application:** Response Time, Error Rate
- **Service:** Uptime, Connections

## Real-time Updates

Siap untuk integrasi Socket.IO:
- **Live Data:** Real-time data streaming dari backend
- **Status Indicators:** Animated pulse untuk live status
- **Auto-refresh:** Smooth transitions untuk data updates
- **Error Handling:** Graceful fallback ke mock data

## Responsive Design

- **Mobile-first:** Optimized untuk semua screen sizes
- **Adaptive Layout:** Grid yang responsive
- **Touch-friendly:** Interactive elements untuk mobile
- **Performance:** GPU-accelerated animations

## Performance Optimization

- **Efficient Rendering:** Minimal re-renders dengan React.memo
- **Data Processing:** Optimized calculations untuk large datasets
- **Memory Management:** Proper cleanup dan state management
- **Animation:** CSS transforms untuk smooth animations

## Penggunaan

```tsx
import { ChartCPU, ChartMemory } from '@/komponen/bagan'

function Dashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="card">
        <div className="card-body">
          <ChartCPU height={300} />
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <ChartMemory height={300} />
        </div>
      </div>
    </div>
  )
}
```

## Dependencies

- **Recharts:** Chart library untuk React
- **TypeScript:** Type safety untuk data structures
- **Tailwind CSS:** Styling dengan custom properties
- **React:** Hooks untuk state management

## Future Enhancements

- **WebSocket Integration:** Real-time data dari backend
- **Interactive Controls:** Zoom, pan, time range selection
- **Export Features:** PNG/PDF export untuk reports
- **Alert Integration:** Click-to-view alert details
- **Custom Dashboards:** Drag-drop chart arrangement
- **Historical Data:** Long-term trend analysis