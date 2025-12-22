# Strategi Validasi Input Data - Implementasi

## Overview

Implementasi lengkap strategi validasi input data untuk aplikasi monitoring server dengan tiga lapisan utama: API HTTP endpoints, Socket.IO events, dan input chat AI.

## Arsitektur Validasi

### 1. Middleware Validasi Express (`middleware/validasi.js`)

#### Fitur Utama:
- **Sanitasi Input**: Otomatis membersihkan input dari karakter berbahaya
- **Type Validation**: Validasi tipe data dan format
- **Length Limits**: Pembatasan panjang input
- **Custom Validators**: Validasi bisnis logic spesifik
- **Error Handling**: Response error yang informatif

#### Validasi yang Diimplementasikan:

##### Server Management:
```javascript
validasiTambahServer // Validasi input server baru
validasiUpdateServer // Validasi update server
validasiHapusServer  // Validasi hapus server
validasiAmbilServerById // Validasi parameter ID
```

##### Metrics & Monitoring:
```javascript
validasiAmbilMetrics // Validasi query metrics
validasiInputMetrics // Validasi input data metrics
```

##### Alert Conditions:
```javascript
validasiAlertCondition // Validasi kondisi alert
```

##### Chat AI (Enhanced Security):
```javascript
validasiChatAI // Validasi dengan pencegahan command injection
```

##### Authentication:
```javascript
validasiRegistrasi // Validasi registrasi user
validasiLogin      // Validasi login
validasiUpdateProfil // Validasi update profil
```

### 2. Validasi Socket.IO (`middleware/socketValidasi.js`)

#### Komponen:

##### Event Validation:
```javascript
validateEventName(eventName)     // Whitelist event names
validateRoomName(roomName)       // Format room validation
validateSocketEvent(event, data, socket) // Comprehensive event validation
```

##### Payload Validation:
```javascript
validateJoinServerPayload(data)    // Validasi join server
validateSendMessagePayload(data)   // Validasi kirim pesan
validateUpdateMetricsPayload(data) // Validasi update metrics
```

##### Rate Limiting:
```javascript
SocketRateLimiter // Rate limiting per socket
- 60 events/minute per socket
- 1000 events/hour per socket
- Automatic cleanup
```

##### Authentication:
```javascript
validateSocketAuth(token) // Token format validation
```

### 3. Integration dengan Routes

#### Server Routes (`rute/ruteServer.js`):
```javascript
router.post('/', validasiTambahServer, kontrolerServer.tambahServer);
router.put('/:id', validasiUpdateServer, kontrolerServer.updateServer);
router.get('/:id', validasiAmbilServerById, kontrolerServer.ambilServerById);
```

#### Chat Routes (`rute/ruteChat.js`):
```javascript
router.post('/tanya', validasiChatAI, kontrolerChat.chatDenganAi);
```

#### Socket.IO Integration (`socket/index.js`):
```javascript
// Event validation di setiap handler
socket.on('pesan:kirim', (data) => {
  const validation = validateSocketEvent('send-message', data, socket);
  if (!validation.valid) {
    socket.emit('error', { message: validation.error });
    return;
  }
  // Process message...
});
```

## Keamanan yang Diimplementasikan

### 1. Input Sanitization

#### HTML Tag Removal:
```javascript
input.replace(/[<>]/g, '') // Remove potential HTML tags
```

#### JavaScript Protocol Removal:
```javascript
input.replace(/javascript:/gi, '') // Remove javascript: protocol
```

#### Event Handler Removal:
```javascript
input.replace(/on\w+=/gi, '') // Remove event handlers
```

### 2. Command Injection Prevention

#### Dangerous Keywords Blocking:
```javascript
const dangerousKeywords = [
  'restart', 'stop', 'kill', 'delete', 'remove', 'execute', 'run',
  'system', 'sudo', 'admin', 'root', 'chmod', 'chown', 'rm -rf',
  'format', 'fdisk', 'mkfs', 'shutdown', 'reboot', 'halt'
];
```

#### Pattern Detection:
```javascript
const dangerousPatterns = [
  /exec\(/i, /eval\(/i, /require\(/i, /process\./i, /fs\./i
];
```

### 3. Data Type Validation

#### MongoDB ObjectId:
```javascript
body('serverId').isMongoId().withMessage('Server ID tidak valid')
```

#### Numeric Ranges:
```javascript
body('cpu.persentase').isFloat({ min: 0, max: 100 })
body('port').isInt({ min: 1, max: 65535 })
```

#### String Length Limits:
```javascript
body('nama').isLength({ min: 2, max: 100 })
body('pertanyaan').isLength({ min: 5, max: 500 })
```

### 4. Business Logic Validation

#### Date Range Validation:
```javascript
query('endDate').custom((value, { req }) => {
  if (req.query.startDate) {
    const start = new Date(req.query.startDate);
    const end = new Date(value);
    if (end <= start) throw new Error('End date must be after start date');
  }
  return true;
})
```

#### Server Access Validation:
```javascript
// Check if user has access to server
const hasAccess = socket.authorizedServers.some(server => server.id === serverId);
```

## Rate Limiting

### API Endpoints:
- **General**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Chat**: 30 messages per hour per user

### Socket.IO:
- **Per Socket**: 60 events per minute
- **Per User**: 1000 events per hour
- **Automatic cleanup** setiap jam

## Error Handling

### Validation Error Response:
```json
{
  "success": false,
  "error": "Data yang dikirim tidak valid. Periksa kembali input Anda.",
  "details": [
    {
      "field": "email",
      "message": "Format email tidak valid",
      "value": "invalid-email",
      "location": "body"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Socket Error Response:
```javascript
socket.emit('error', { message: 'Room name tidak valid' });
```

## Logging & Monitoring

### Validation Failures:
```javascript
logger.logUserActivity(userId, 'VALIDATION_FAILED', {
  endpoint: req.url,
  method: req.method,
  errors: formattedErrors,
  ip: req.ip
});
```

### Rate Limit Exceeded:
```javascript
logger.logSystemActivity('RATE_LIMIT_EXCEEDED', {
  userId: socket.userId,
  eventName,
  ip: socket.handshake.address
});
```

## Testing Strategy

### Unit Tests:
```javascript
describe('Input Validation', () => {
  test('should reject invalid server name', () => {
    const result = validateServerInput({ nama: '<script>alert(1)</script>' });
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests:
```javascript
describe('API Validation', () => {
  test('should return 400 for invalid input', async () => {
    const response = await request(app)
      .post('/api/server')
      .send({ nama: '' })
      .expect(400);
  });
});
```

## Performance Considerations

### Efficient Validation:
- **Early Exit**: Stop validation on first error
- **Caching**: Cache compiled regex patterns
- **Async Validation**: Non-blocking untuk database checks

### Memory Management:
- **Input Limits**: Prevent large payload attacks
- **Cleanup**: Automatic cleanup rate limit data
- **Streaming**: Handle large files without loading to memory

## Maintenance & Updates

### Adding New Validation:
1. Define validation rules in `middleware/validasi.js`
2. Import and use in route handlers
3. Add corresponding tests
4. Update documentation

### Updating Security Rules:
1. Review dangerous keywords/patterns regularly
2. Monitor validation failure logs
3. Update rate limits based on usage patterns
4. Test with security tools (OWASP ZAP, Burp Suite)

## Compliance & Standards

### Security Standards:
- **OWASP Input Validation Cheat Sheet**
- **Node.js Security Best Practices**
- **MongoDB Injection Prevention**

### Data Protection:
- **GDPR Compliance**: Minimal data collection
- **Input Logging**: Audit trail tanpa sensitive data
- **Anonymization**: Remove PII from logs

---

*Implementasi validasi ini memastikan aplikasi tetap aman dan handal dalam menghadapi berbagai jenis serangan input.*</content>
<parameter name="filePath">d:\Tugas_Kuliah\Semester-5\PJ\fix_final_project\VALIDATION_STRATEGY_README.md