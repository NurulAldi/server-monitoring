# Mekanisme Penanganan Error Global - Backend

## Overview
Sistem penanganan error global dirancang untuk menangkap, mengklasifikasi, dan menangani semua jenis error yang mungkin terjadi dalam aplikasi monitoring server dengan cara yang konsisten dan user-friendly.

## Komponen Error Handling

### 1. Custom Error Classes
**File**: `backend/src/utilitas/customErrors.js`

#### Tujuan:
- Standardisasi error response
- Type safety untuk error handling
- Konsistensi kode error dan pesan

#### Error Classes Tersedia:

| Error Class | Status Code | Kode Error | Kegunaan |
|-------------|-------------|------------|----------|
| `ValidationError` | 400 | VALIDATION_ERROR | Input validation gagal |
| `AuthenticationError` | 401 | UNAUTHORIZED | Login/token invalid |
| `AuthorizationError` | 403 | INSUFFICIENT_PERMISSIONS | Tidak punya permission |
| `NotFoundError` | 404 | NOT_FOUND | Resource tidak ditemukan |
| `ConflictError` | 409 | ALREADY_EXISTS | Data duplikat |
| `RateLimitError` | 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| `DatabaseError` | 500 | DATABASE_ERROR | Database operation gagal |
| `ExternalAPIError` | 502 | EXTERNAL_API_ERROR | API eksternal error |
| `SocketError` | 500 | INTERNAL_ERROR | Socket.IO error |
| `BusinessLogicError` | 400 | VALIDATION_ERROR | Business rule violation |
| `FileError` | 500 | INTERNAL_ERROR | File system error |

#### Contoh Penggunaan:
```javascript
const { ValidationError, NotFoundError } = require('../utilitas/customErrors');

// Dalam controller
if (!user) {
  throw new NotFoundError('Pengguna', userId);
}

if (!isValidEmail(email)) {
  throw new ValidationError('Format email tidak valid');
}
```

### 2. Global Error Handler Middleware
**File**: `backend/src/middleware/errorHandler.js`

#### Fitur:
- **Error Classification**: Otomatis mengklasifikasi jenis error
- **Consistent Response**: Format response yang selalu sama
- **Development vs Production**: Detail error berbeda berdasarkan environment
- **Logging Integration**: Semua error dicatat dengan context lengkap

#### Response Format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan error dalam bahasa Indonesia",
    "timestamp": "2025-12-21T10:30:00Z",
    "details": [] // Optional, untuk validation errors
  }
}
```

### 3. Socket.IO Error Handling
**File**: `backend/src/middleware/errorHandler.js`

#### Fitur:
- **Real-time Error Notification**: Error dikirim ke client via Socket.IO
- **Event Context**: Error mencakup informasi event yang gagal
- **Async Handler Wrapper**: Wrapper untuk event handlers async

#### Contoh Penggunaan:
```javascript
const { handleSocketError, asyncSocketHandler } = require('../middleware/errorHandler');

// Manual error handling
try {
  // socket operation
} catch (error) {
  handleSocketError(socket, error, 'send_message');
}

// Async wrapper
socket.on('send_message', asyncSocketHandler(async (socket, data) => {
  // handler logic - errors akan ditangani otomatis
}));
```

### 4. Logging System
**File**: `backend/src/utilitas/logger.js`

#### Level Logging:
- **ERROR**: Error kritis yang perlu segera diperbaiki
- **WARN**: Peringatan yang perlu diawasi
- **INFO**: Informasi normal operasi
- **DEBUG**: Detail teknis untuk development

#### Log Files:
- `logs/app.log`: Semua log level info ke atas
- `logs/error.log`: Hanya error logs
- Console output: Development-friendly format

#### Context Information:
Setiap error log mencakup:
- User ID (jika tersedia)
- IP address dan User-Agent
- HTTP method dan URL
- Timestamp
- Stack trace lengkap

## Implementasi di Kode

### 1. Setup di server.js
```javascript
// Import error handler
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Setup middleware (urutan penting!)
app.use(notFoundHandler); // 404 handler harus sebelum error handler
app.use(errorHandler);    // Global error handler paling akhir
```

### 2. Penggunaan Custom Errors
```javascript
const { ValidationError, NotFoundError, AuthenticationError } = require('../utilitas/customErrors');

// Dalam route handler
app.post('/api/users', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new ValidationError('Email dan password wajib diisi');
    }

    // Business logic
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email sudah terdaftar');
    }

    // Success
    res.json({ success: true, data: newUser });
  } catch (error) {
    next(error); // Pass ke error handler
  }
});
```

### 3. Socket.IO Error Handling
```javascript
const { asyncSocketHandler, handleSocketError } = require('../middleware/errorHandler');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Event dengan auto error handling
    socket.on('send_message', asyncSocketHandler(async (socket, data) => {
      if (!data.message) {
        throw new ValidationError('Pesan tidak boleh kosong');
      }

      // Process message
      return await processMessage(socket, data);
    }));

    // Manual error handling
    socket.on('join_room', async (data) => {
      try {
        await joinRoom(socket, data.roomId);
        socket.emit('room_joined', { success: true });
      } catch (error) {
        handleSocketError(socket, error, 'join_room');
      }
    });
  });
}
```

## Error Categories & Handling

### 1. Operational Errors (Dapat Dianalisis)
- Database connection issues
- External API failures
- File system errors
- Network timeouts

**Handling**: Log, retry if appropriate, notify user dengan pesan user-friendly

### 2. Programmer Errors (Bug dalam Kode)
- Null reference errors
- Type errors
- Logic errors
- Configuration errors

**Handling**: Log dengan stack trace lengkap, alert developer, restart if necessary

### 3. User Errors (Input Invalid)
- Validation failures
- Authentication failures
- Authorization failures
- Business rule violations

**Handling**: Return appropriate HTTP status dengan pesan jelas, no stack trace

## Best Practices

### 1. Selalu Gunakan Custom Errors
```javascript
// ❌ Bad
throw new Error('User not found');

// ✅ Good
throw new NotFoundError('Pengguna', userId);
```

### 2. Wrap Async Code
```javascript
// Dalam route handlers
const { asyncErrorHandler } = require('../middleware/errorHandler');

router.get('/users', asyncErrorHandler(async (req, res) => {
  // Logic here - errors akan ditangani otomatis
}));
```

### 3. Jangan Expose Sensitive Information
```javascript
// ❌ Bad - expose database details
throw new Error('MongoDB connection failed: auth failed');

// ✅ Good - user-friendly message
throw new DatabaseError('Gagal mengakses database');
```

### 4. Log dengan Context
```javascript
const { logger } = require('../utilitas/logger');

try {
  // operation
} catch (error) {
  logger.logError(error, {
    userId: req.user?.id,
    operation: 'create_user',
    inputData: req.body
  });
  throw error; // Re-throw untuk error handler
}
```

## Testing Error Handling

### Unit Tests:
```javascript
describe('Error Classes', () => {
  it('should create ValidationError with correct properties', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('VALIDATION_ERROR');
  });
});

describe('Error Handler', () => {
  it('should return correct response for ValidationError', async () => {
    const error = new ValidationError('Test error');
    const response = await request(app).get('/test-error').throw(error);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## Monitoring & Alerting

### Error Metrics:
- Error rate per endpoint
- Most common error types
- Error trends over time
- User impact assessment

### Alerting Rules:
- Error rate > 5% dalam 5 menit
- Critical errors (500 status)
- Database connection failures
- External API failures

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Last Updated**: December 21, 2025
**Version**: 1.0.0