# Rancangan Keamanan Dasar - Sistem Monitoring Server

## Overview
Dokumen ini menjelaskan implementasi keamanan dasar untuk sistem monitoring server, termasuk autentikasi pengguna, otorisasi berbasis peran (RBAC), dan keamanan koneksi Socket.IO.

## Komponen Keamanan

### 1. JWT Token Management
**File**: `backend/src/middleware/autentikasi.js`, `backend/src/kontroler/kontrolerAutentikasi.js`

#### Fitur:
- **Access Token**: Berlaku 15 menit untuk operasi API
- **Refresh Token**: Berlaku 7 hari untuk memperpanjang sesi
- **Token Revocation**: Logout dapat merevoke token spesifik atau semua token
- **Token Validation**: Verifikasi signature, expiry, dan payload

#### Endpoint:
- `POST /api/auth/login` - Generate access & refresh token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Revoke refresh token(s)
- `GET /api/auth/verify` - Verifikasi token validitas

### 2. Role-Based Access Control (RBAC)
**File**: `backend/src/middleware/autentikasi.js`

#### Roles:
- **user**: Akses dasar ke server yang dimiliki/diberi akses
- **admin**: Akses ke semua server aktif + management server
- **superadmin**: Akses penuh ke semua server dan sistem

#### Middleware:
```javascript
const { authenticateToken, requireRole } = require('../middleware/autentikasi');

// Contoh penggunaan
router.get('/admin-only', authenticateToken, requireRole('admin'), handler);
router.get('/multi-role', authenticateToken, requireRole(['admin', 'superadmin']), handler);
```

### 3. Session Handling
**File**: `backend/src/kontroler/kontrolerAutentikasi.js`, `backend/src/model/Pengguna.js`

#### Fitur:
- **Multi-device Support**: User dapat login dari multiple devices
- **Device Tracking**: Simpan info device untuk setiap refresh token
- **Session Management**: Revoke session per device atau semua devices
- **Account Lockout**: Lock account setelah 5 kali gagal login (15 menit)
- **Login Attempts Tracking**: Monitor dan limit failed login attempts

### 4. Socket.IO Security
**File**: `backend/src/socket/index.js`, `backend/src/middleware/socketValidasi.js`

#### Authentication:
- **Token-based Auth**: Setiap koneksi Socket.IO memerlukan JWT token
- **Connection Validation**: Verifikasi token pada setiap koneksi baru
- **User Context**: Attach user info ke socket instance

#### Authorization:
- **Room-based Access**: User hanya join rooms yang authorized
- **Role-based Rooms**:
  - `user_{userId}`: Personal room
  - `admin`: Admin-only room
  - `superadmin`: Superadmin-only room
  - `server_{serverId}`: Server-specific room (berdasarkan permissions)
  - `maintenance`: System notifications
  - `org_main`: Organization broadcasts

#### Real-time Authorization:
- **Event Validation**: Validasi setiap incoming event
- **Rate Limiting**: Limit event frequency per user
- **Payload Sanitization**: Clean dan validate event payloads

### 5. Security Monitoring & Logging
**File**: `backend/src/utilitas/logger.js`

#### Event Types:
- **Authentication Events**: Login, logout, token operations
- **Authorization Events**: Permission checks, role validations
- **Security Events**: Failed auth attempts, suspicious activities
- **Socket Events**: Connection auth, room joins, event validations

## Risiko dan Pencegahan

### Risiko Utama:
1. **Akses Tanpa Login**: Dicegah dengan JWT middleware pada semua endpoint
2. **Socket Anonim**: Dicegah dengan token validation pada connection
3. **Privilege Escalation**: Dicegah dengan RBAC dan role validation
4. **Session Hijacking**: Dicegah dengan token expiry dan refresh mechanism
5. **Brute Force**: Dicegah dengan account lockout dan rate limiting

### Pencegahan Teknis:
- **Input Validation**: Comprehensive validation pada semua input
- **Rate Limiting**: API dan Socket.IO rate limiting
- **Token Security**: Secure token storage dan transmission
- **Session Management**: Proper session cleanup dan monitoring
- **Audit Logging**: Comprehensive logging untuk forensic analysis

## Konfigurasi Environment

### Required Environment Variables:
```env
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# Security Settings
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_MINUTES=15
```

## Testing Security

### Unit Tests:
- JWT token generation dan validation
- RBAC middleware functionality
- Socket authentication
- Rate limiting behavior

### Integration Tests:
- Complete authentication flow
- Role-based access scenarios
- Socket.IO connection security
- Session management

### Security Audits:
- Penetration testing
- Token security validation
- Access control verification
- Logging completeness check

## Maintenance & Updates

### Regular Tasks:
1. **Token Secret Rotation**: Rotate JWT secrets periodically
2. **Log Analysis**: Monitor security logs untuk anomalies
3. **Dependency Updates**: Update security-related packages
4. **Configuration Review**: Review dan update security settings

### Emergency Procedures:
1. **Token Revocation**: Mass logout semua users jika breach suspected
2. **Account Lockdown**: Lock suspicious accounts
3. **Log Preservation**: Secure logs untuk investigation
4. **System Isolation**: Isolate compromised components

## Integration Points

### Dengan Sistem Existing:
- **AI Logging**: Authentication required untuk AI analytics endpoints
- **Alert System**: Role-based alert notifications via Socket.IO
- **Server Monitoring**: Authorized access ke server metrics
- **Validation System**: Integrated input validation dengan auth checks

### API Integration:
```javascript
// Frontend integration example
const socket = io.connect('/', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});
```

## Future Enhancements

### Planned Security Features:
1. **Two-Factor Authentication (2FA)**
2. **OAuth2 Integration**
3. **API Key Management**
4. **Advanced Rate Limiting**
5. **Security Headers (Helmet.js)**
6. **CORS Configuration**
7. **CSRF Protection**

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Last Updated**: December 21, 2025
**Version**: 1.0.0