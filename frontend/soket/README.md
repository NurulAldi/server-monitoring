# Socket.IO Client Integration

Integrasi Socket.IO client untuk real-time data updates pada frontend Next.js sistem monitoring server.

## Arsitektur Integrasi

### 1. Provider Hierarchy
```
RootLayout
├── AutentikasiProvider (Context)
│   └── SocketProvider (Context)
│       ├── ConnectionStatus (Global UI)
│       └── App Components
│           ├── Dashboard
│           ├── Charts (with socket hooks)
│           └── Alerts (with socket hooks)
```

### 2. Inisialisasi Socket

**Timing:**
- ✅ **App-level**: Socket diinisialisasi di RootLayout setelah autentikasi
- ✅ **Post-login**: Connection dilakukan setelah user login berhasil
- ✅ **Persistent**: Socket tetap connected selama session aktif
- ✅ **Auto-reconnect**: Otomatis reconnect dengan exponential backoff

**Authentication:**
- ✅ **JWT Token**: Token dikirim via `socket.auth` pada connection
- ✅ **Middleware validation**: Backend validasi token untuk setiap connection
- ✅ **Session management**: Token di-refresh otomatis sebelum expiry

### 3. Room Management

**User-specific Rooms:**
- `user:{userId}` - Notifikasi personal
- `server:{serverId}` - Monitoring data server tertentu
- `role:{role}` - Akses kontrol berdasarkan role (admin, operator, viewer)

**Dynamic Joining:**
- ✅ Join room otomatis berdasarkan halaman yang dikunjungi
- ✅ Leave room saat component unmount
- ✅ Permission-based room access

### 4. Real-time Data Updates

**State Management:**
- ✅ **Global Context**: SocketProvider untuk connection state
- ✅ **Custom Hooks**: `useMetrics`, `useAlerts`, `useServers` untuk data subscription
- ✅ **Component-level**: Individual charts subscribe ke events spesifik
- ✅ **Optimistic Updates**: UI update langsung saat event diterima

**Event Mapping:**
```typescript
// Server Metrics
'metrics:update' → useMetrics hook
'server:status' → useServers hook

// Application Metrics
'app:metrics:update' → useAppMetrics hook

// Alerts & Notifications
'alert:new' → useAlerts hook
'alert:update' → useAlerts hook
'alert:resolved' → useAlerts hook
```

### 5. Custom Hooks

#### System Metrics Hooks
```typescript
useCPUMetrics(serverId?) → { data, currentUsage, isOnline }
useMemoryMetrics(serverId?) → { data, currentMemory, isOnline }
useNetworkMetrics(serverId?) → { data, currentNetwork, isOnline }
useDiskMetrics(serverId?) → { data, currentDisk, isOnline }
useLoadMetrics(serverId?) → { data, currentLoad, isOnline }
useTemperatureMetrics(serverId?) → { data, currentTemp, isOnline }
```

#### Application Metrics Hooks
```typescript
useResponseTimeMetrics() → { data, currentResponse, isOnline }
useErrorRateMetrics() → { data, currentErrors, isOnline }
useUptimeMetrics() → { data, currentUptime, isOnline }
useConnectionMetrics() → { data, currentConnections, isOnline }
```

#### System Hooks
```typescript
useAlerts() → { alerts, activeAlerts, acknowledgeAlert, resolveAlert }
useServers() → { servers, refreshServers, onlineServers, offlineServers }
useSocket() → { socket, isConnected, emit, on, off, joinRoom, leaveRoom }
```

### 6. Chart Integration

**Real-time Charts:**
- ✅ **ChartCPU**: Menggunakan `useCPUMetrics` hook
- ✅ **ChartMemory**: Menggunakan `useMemoryMetrics` hook
- 🔄 **ChartNetwork**: Siap untuk `useNetworkMetrics`
- 🔄 **ChartDisk**: Siap untuk `useDiskMetrics`
- 🔄 **ChartLoad**: Siap untuk `useLoadMetrics`
- 🔄 **ChartTemperature**: Siap untuk `useTemperatureMetrics`
- 🔄 **ChartResponseTime**: Siap untuk `useResponseTimeMetrics`
- 🔄 **ChartErrorRate**: Siap untuk `useErrorRateMetrics`
- 🔄 **ChartUptime**: Siap untuk `useUptimeMetrics`
- 🔄 **ChartConnections**: Siap untuk `useConnectionMetrics`

**Fallback Strategy:**
- ✅ **Mock Data**: Charts menampilkan mock data saat socket offline
- ✅ **Graceful Degradation**: UI tetap berfungsi tanpa real-time updates
- ✅ **Status Indicators**: Visual indicator untuk connection status

### 7. Error Handling & Recovery

**Connection Management:**
- ✅ **Auto-reconnect**: Exponential backoff untuk reconnection
- ✅ **Connection Limits**: Rate limiting untuk mencegah abuse
- ✅ **Error Boundaries**: Graceful error handling untuk socket errors

**Data Consistency:**
- ✅ **Optimistic Updates**: UI update langsung dengan rollback pada error
- ✅ **Data Validation**: Validasi data sebelum update state
- ✅ **Memory Cleanup**: Proper cleanup saat component unmount

### 8. Performance Optimization

**Data Management:**
- ✅ **Selective Updates**: Hanya update components yang visible
- ✅ **Data Throttling**: Limit update frequency untuk prevent lag
- ✅ **Memory Limits**: Keep only recent data points (60 untuk CPU, 30 untuk Memory)

**Bundle Optimization:**
- ✅ **Dynamic Imports**: Socket code di-load secara lazy
- ✅ **Tree Shaking**: Hanya import hooks yang digunakan
- ✅ **Code Splitting**: Separate socket bundle dari main bundle

### 9. Security Considerations

**Authentication:**
- ✅ **Token-based**: Semua connections memerlukan valid JWT
- ✅ **Session Validation**: Token divalidasi di setiap connection
- ✅ **Secure Transport**: WSS untuk production (configurable)

**Authorization:**
- ✅ **Room-based Access**: Users hanya join rooms yang authorized
- ✅ **Data Filtering**: Server-side filtering berdasarkan permissions
- ✅ **Audit Logging**: Log semua socket activities

### 10. Configuration

**Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Socket Configuration:**
```typescript
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  auth: { token },
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  randomizationFactor: 0.5
})
```

### 11. Monitoring & Debugging

**Connection Status:**
- ✅ **Global Indicator**: ConnectionStatus component di bottom-right
- ✅ **Real-time Updates**: Status berubah otomatis
- ✅ **Error Display**: Menampilkan error messages saat disconnect

**Debug Logging:**
- ✅ **Connection Events**: Log connect/disconnect events
- ✅ **Data Events**: Log incoming data untuk debugging
- ✅ **Error Events**: Comprehensive error logging

### 12. Testing Strategy

**Unit Tests:**
- ✅ **Hook Testing**: Test socket hooks dengan mock data
- ✅ **Provider Testing**: Test context providers
- ✅ **Component Testing**: Test chart components dengan socket data

**Integration Tests:**
- ✅ **End-to-end**: Test full socket connection flow
- ✅ **Real-time Updates**: Test data updates dari server
- ✅ **Error Scenarios**: Test disconnect/reconnect scenarios

### 13. Deployment Considerations

**Production Setup:**
- ✅ **Environment Config**: Different URLs untuk dev/staging/prod
- ✅ **SSL/TLS**: WSS connections untuk production
- ✅ **Load Balancing**: Socket.IO dengan Redis adapter untuk scaling

**Scalability:**
- ✅ **Connection Pooling**: Reuse connections untuk multiple subscriptions
- ✅ **Event Filtering**: Client-side filtering untuk reduce bandwidth
- ✅ **Data Compression**: Enable compression untuk large payloads

## File Structure

```
frontend/
├── soket/
│   ├── SocketProvider.tsx      # Main socket context provider
│   ├── useMetrics.ts          # System metrics hooks
│   ├── useAppMetrics.ts       # Application metrics hooks
│   └── index.ts               # Exports
├── komponen/
│   ├── umum/
│   │   └── ConnectionStatus.tsx # Global connection indicator
│   └── bagan/
│       ├── ChartCPU.tsx       # CPU chart with socket integration
│       ├── ChartMemory.tsx    # Memory chart with socket integration
│       └── ...                # Other charts (ready for integration)
├── kait/
│   └── AutentikasiProvider.tsx # Auth context provider
├── app/
│   ├── layout.tsx            # Root layout with providers
│   └── dashboard/
│       └── page.tsx          # Dashboard with real-time charts
└── .env.local               # Environment configuration
```

## Usage Examples

### Using Socket Hooks in Components
```tsx
function Dashboard() {
  const { data: cpuData, currentUsage } = useCPUMetrics('server-1')
  const { alerts, activeAlerts } = useAlerts()
  const { isConnected } = useSocket()

  return (
    <div>
      <ChartCPU serverId="server-1" />
      <ConnectionStatus />
    </div>
  )
}
```

### Manual Socket Operations
```tsx
function CustomComponent() {
  const { socket, emit, on, joinRoom } = useSocket()

  useEffect(() => {
    joinRoom('custom:room')
    on('custom:event', handleEvent)

    return () => {
      socket?.off('custom:event', handleEvent)
    }
  }, [])

  const sendMessage = () => {
    emit('custom:event', { data: 'hello' })
  }
}
```

Integrasi Socket.IO ini menyediakan foundation yang robust untuk real-time monitoring dengan proper error handling, security, dan performance optimizations.