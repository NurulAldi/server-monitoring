# Sistem Logging Aktivitas - Backend

## Overview
Sistem logging aktivitas dirancang untuk mencatat semua interaksi penting dalam aplikasi monitoring server dengan struktur JSON yang konsisten dan terorganisir berdasarkan kategori aktivitas.

## Kategori Logging Aktivitas

### 1. **Authentication (Login User)**
**File Log**: `logs/activity.log`

Mencatat semua aktivitas autentikasi pengguna:
- Login berhasil/gagal
- Device dan lokasi informasi
- Session management

```json
{
  "category": "authentication",
  "event": "user_login",
  "userId": "user123",
  "details": {
    "method": "password|google|token_refresh",
    "deviceType": "desktop|mobile|tablet",
    "location": "Jakarta, Indonesia",
    "success": true,
    "failureReason": "invalid_password|account_locked",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "session456"
  }
}
```

### 2. **Socket Connections**
**File Log**: `logs/activity.log`

Mencatat koneksi dan diskoneksi Socket.IO:
- Connection establishment
- Room subscriptions
- Connection duration
- Disconnect reasons

```json
{
  "category": "socket",
  "event": "socket_connect|socket_disconnect",
  "userId": "user123",
  "socketId": "socket_abc123",
  "details": {
    "connectionType": "websocket|polling",
    "rooms": ["user_123", "admin", "server_xyz"],
    "connectionDuration": 3600000,
    "disconnectReason": "client_disconnect|timeout|server_restart",
    "bytesTransferred": 15432,
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### 3. **Server Status Changes**
**File Log**: `logs/system.log`

Mencatat perubahan status kesehatan server:
- Status transitions (online → offline)
- Metrics saat perubahan
- Reason for status change
- Downtime calculation

```json
{
  "category": "server",
  "event": "server_status_change",
  "userId": "system|user123",
  "serverId": "server_456",
  "details": {
    "serverName": "Production Web Server",
    "oldStatus": "online",
    "newStatus": "critical",
    "changeReason": "cpu_overload|manual_restart",
    "metrics": {
      "cpu": 95.5,
      "memory": 87.2,
      "disk": 45.1
    },
    "downtime": 300000
  }
}
```

### 4. **Email Alert Notifications**
**File Log**: `logs/system.log`

Mencatat pengiriman email alert:
- Delivery status
- Recipients dan templates
- SMTP responses
- Retry attempts

```json
{
  "category": "alert",
  "event": "email_alert_sent",
  "userId": "system",
  "alertId": "alert_789",
  "details": {
    "alertType": "cpu_warning|memory_critical",
    "recipients": ["admin@company.com", "user123@company.com"],
    "emailTemplate": "ai_analysis_template",
    "deliveryStatus": "sent|failed|queued",
    "smtpResponse": "250 OK",
    "retryCount": 0,
    "emailSize": 2048,
    "subject": "🚨 CRITICAL: Server CPU Overload"
  }
}
```

### 5. **AI Interactions**
**File Log**: `logs/ai.log`

Mencatat semua interaksi dengan AI:
- Token usage dan performance
- User queries dan AI responses
- Confidence scores
- Error tracking

```json
{
  "category": "ai",
  "event": "ai_interaction",
  "userId": "user123",
  "sessionId": "ai_session_101",
  "details": {
    "provider": "openai|gemini",
    "model": "gpt-4|gemini-pro",
    "interactionType": "chat|analysis|recommendation",
    "inputTokens": 150,
    "outputTokens": 200,
    "totalTokens": 350,
    "responseTime": 2500,
    "userQuery": "Analyze server performance",
    "aiResponse": "Server performance is optimal...",
    "confidence": 0.95,
    "feedback": "helpful|not_helpful|null"
  }
}
```

### 6. **Security Events**
**File Log**: `logs/security.log`

Mencatat event keamanan:
- Failed authentication attempts
- Suspicious activities
- Permission violations
- Security incidents

```json
{
  "category": "security",
  "event": "failed_login_attempt",
  "userId": "unknown|user123",
  "details": {
    "severity": "low|medium|high",
    "description": "Multiple failed login attempts",
    "action": "account_locked|ip_blocked",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## Struktur File Log

### File Organization
```
logs/
├── activity.log          # Authentication & Socket events
├── security.log          # Security-related events
├── system.log            # Server status & alerts
├── ai.log               # AI interactions
├── performance.log      # Performance metrics
└── error.log            # Error logs
```

### Log Rotation
- **Max Size**: 10MB per file (5MB untuk security/error)
- **Max Files**: 30 files (90 untuk security, 3 untuk error)
- **Rotation**: Daily + size-based
- **Compression**: Automatic gzip untuk files lama

## Method Logging API

### Authentication Logging
```javascript
const { logUserLogin } = require('../utilitas/logger');

logUserLogin(userId, {
  method: 'password',
  deviceType: 'desktop',
  location: 'Jakarta',
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  success: true,
  sessionId: 'session123'
});
```

### Socket Connection Logging
```javascript
const { logSocketConnection } = require('../utilitas/logger');

logSocketConnection(userId, 'connect', {
  socketId: socket.id,
  connectionType: 'websocket',
  rooms: Array.from(socket.rooms),
  ip: socket.handshake.address
});
```

### Server Status Logging
```javascript
const { logServerStatusChange } = require('../utilitas/logger');

logServerStatusChange(serverId, {
  serverName: 'Production Server',
  oldStatus: 'online',
  newStatus: 'critical',
  changeReason: 'cpu_overload',
  metrics: { cpu: 95.5, memory: 87.2 },
  userId: 'system'
});
```

### Email Alert Logging
```javascript
const { logEmailAlert } = require('../utilitas/logger');

logEmailAlert(alertId, {
  alertType: 'cpu_critical',
  recipients: ['admin@company.com'],
  deliveryStatus: 'sent',
  smtpResponse: '250 OK',
  subject: '🚨 CRITICAL: Server Down'
});
```

### AI Interaction Logging
```javascript
const { logAIInteraction } = require('../utilitas/logger');

logAIInteraction(userId, {
  sessionId: 'session123',
  provider: 'openai',
  model: 'gpt-4',
  interactionType: 'chat',
  inputTokens: 150,
  outputTokens: 200,
  responseTime: 2500,
  userQuery: 'Analyze server',
  aiResponse: 'Server is healthy',
  confidence: 0.95
});
```

### Security Event Logging
```javascript
const { logSecurityEvent } = require('../utilitas/logger');

logSecurityEvent('failed_login_attempt', {
  userId: 'unknown',
  severity: 'medium',
  description: '5 failed login attempts',
  ip: req.ip,
  userAgent: req.get('User-Agent')
});
```

## Manfaat untuk Evaluasi Sistem

### 1. **Performance Monitoring**
- Response time trends per endpoint
- User session duration analysis
- Socket connection stability metrics
- AI response time optimization

### 2. **Security Analysis**
- Failed login attempt patterns
- Geographic access analysis
- Suspicious activity detection
- Account lockout effectiveness

### 3. **User Experience Insights**
- Feature usage patterns
- Error frequency per user segment
- Device/platform preferences
- Session abandonment analysis

### 4. **AI Effectiveness Evaluation**
- Response quality metrics
- Token usage optimization
- User satisfaction tracking
- Model performance comparison

### 5. **Operational Intelligence**
- Server health trend analysis
- Alert effectiveness measurement
- Capacity planning data
- Incident response improvement

### 6. **Business Analytics**
- User engagement metrics
- System adoption rates
- Feature utilization reports
- ROI measurement for AI features

## Implementasi di Kode

### Automatic Logging Integration

**Authentication (dalam `kontrolerAutentikasi.js`):**
```javascript
// Login success
logUserLogin(pengguna._id, {
  method: 'password',
  deviceType: getDeviceType(req.get('User-Agent')),
  ip: req.ip,
  success: true,
  sessionId: Date.now().toString()
});
```

**Socket Connections (dalam `socket/index.js`):**
```javascript
io.on('connection', (socket) => {
  logSocketConnection(socket.userId, 'connect', {
    socketId: socket.id,
    connectionType: 'websocket',
    ip: socket.handshake.address
  });
});
```

**Server Status (dalam `layananServer.js`):**
```javascript
// In updateStatusServer function
if (oldStatus !== status) {
  logServerStatusChange(serverId, {
    serverName: server.nama,
    oldStatus,
    newStatus: status,
    changeReason: 'monitoring_update',
    metrics: metrikTerbaru
  });
}
```

**Email Alerts (dalam `layananAlert.js`):**
```javascript
// After successful email send
logEmailAlert(alert._id.toString(), {
  alertType: kondisi.level,
  recipients: [emailData.to],
  deliveryStatus: 'sent',
  subject: subjekEmail
});
```

**AI Interactions (dalam `sharedAIService.js`):**
```javascript
// In executeCompletion method
logAIInteraction(userId, {
  provider: 'openai',
  model: completionConfig.model,
  inputTokens: usage?.prompt_tokens,
  outputTokens: usage?.completion_tokens,
  responseTime,
  userQuery: messages[messages.length - 1]?.content,
  aiResponse: response
});
```

## Monitoring & Alerting

### Real-time Dashboards
- Live activity feeds
- Error rate monitoring
- Performance metrics visualization
- Security incident alerts

### Automated Alerts
- Error rate threshold alerts
- Security incident notifications
- Performance degradation warnings
- AI service failure alerts

### Log Analysis Tools
- Search dan filter capabilities
- Trend analysis
- Correlation analysis
- Automated reporting

## Best Practices

### 1. **Consistent Structure**
- Selalu gunakan method logging yang disediakan
- Jaga konsistensi field names
- Include semua required fields

### 2. **Performance Considerations**
- Asynchronous logging untuk tidak block main thread
- Buffer logging untuk high-volume scenarios
- Smart filtering untuk development vs production

### 3. **Security & Privacy**
- Sanitize sensitive data sebelum logging
- Comply dengan data retention policies
- Secure log file permissions

### 4. **Monitoring Overhead**
- Regular log rotation untuk manage disk space
- Compression untuk archive logs
- Index optimization untuk search performance

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Last Updated**: December 21, 2025
**Version**: 1.0.0