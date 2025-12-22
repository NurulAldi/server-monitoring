# Authentication Flow Audit Summary

**Date**: December 22, 2025  
**Objective**: Simplify authentication to email/password only, remove profile features, ensure SMTP access for alerts

---

## ✅ Audit Completed

### 1. **Authentication Flow Simplified**

#### Frontend Types ([frontend/jenis/autentikasi.ts](frontend/jenis/autentikasi.ts))
- ✅ **Pengguna interface**: Reduced to `id` and `email` only
- ✅ **DataRegister**: Removed `nama` field
- ✅ **Removed types**: DataResetPassword, DataUbahPassword (not needed)
- ✅ **Session state**: Only tracks user ID and email

#### Database Schema ([backend/src/model/Pengguna.js](backend/src/model/Pengguna.js))
**Removed fields:**
- ❌ `nama` - Not needed for authentication
- ❌ `statusAktif` - Single user type, no status needed
- ❌ `terakhirLogin` - No tracking required
- ❌ `dibuatPada` / `diperbaruiPada` - Not needed for no-profile approach
- ❌ `emailTerverifikasi` - Email verification not required
- ❌ `tokenVerifikasiEmail` - Related to removed verification
- ❌ `statistikEmail` - Email stats not tracked
- ❌ `peran` - Single user type, no roles

**Kept fields (essential):**
- ✅ `email` - For login and SMTP notifications
- ✅ `kataSandi` - Password (hashed with bcrypt)
- ✅ `percobaanLoginGagal` - Brute force protection
- ✅ `dikunciSampai` - Account lock mechanism
- ✅ `pengaturanEmail` - Alert notification preferences for SMTP

**Methods simplified:**
- ✅ `recordLoginBerhasil()` - Reset failed attempts only
- ✅ `recordLoginGagal()` - Track failures and lock account
- ✅ `verifikasiPassword()` - Compare password hashes
- ❌ Removed: `generateResetPasswordToken()`, `verifikasiResetPasswordToken()`, `clearResetPasswordToken()`
- ❌ Removed: `getStatistikPengguna()` - No admin stats needed
- ❌ Removed: `hariSejakLoginTerakhir` virtual - No tracking

---

### 2. **JWT Session Management** ([backend/src/konfigurasi/jwt.js](backend/src/konfigurasi/jwt.js))

**Token Payload - Simplified:**
```javascript
{
  id: user._id,
  email: user.email,  // For SMTP access
  iat: timestamp
}
```

**Removed from payload:**
- ❌ `peran` - No role-based access
- ❌ `nama` - Not needed in session

**Security:**
- ✅ 24-hour token expiration
- ✅ HttpOnly cookies
- ✅ CSRF protection (sameSite: strict)

---

### 3. **SMTP Integration Verified** ✅

Email is accessible to SMTP notification service through multiple paths:

#### Alert Service ([backend/src/layanan/layananAlert.js](backend/src/layanan/layananAlert.js))
```javascript
// Line ~1730: Fetch user for alert
const user = await Pengguna.findById(server.pemilik);

// Line ~1777: Send email using user.email
await layananEmail.kirimEmailAlertServer(user.email, dataAlert);
```

#### Email Settings ([backend/src/model/Pengguna.js](backend/src/model/Pengguna.js))
```javascript
pengaturanEmail: {
  alertKritis: Boolean,      // Critical alerts
  alertPeringatan: Boolean,  // Warning alerts
  alertRecovery: Boolean,    // Recovery alerts
  frekuensiNotifikasi: String, // immediate/hourly/daily/weekly
  ringkasanHarian: Boolean,   // Daily summaries
  ringkasanMingguan: Boolean, // Weekly summaries
  rekomendasiAi: Boolean,     // AI recommendations
  zonaWaktu: String           // Asia/Jakarta
}
```

**✅ SMTP Access Confirmed**: User email is directly available to notification system for server health alerts.

---

### 4. **Authentication Services** ([backend/src/layanan/layananAutentikasi.js](backend/src/layanan/layananAutentikasi.js))

#### **Registrasi** - Simplified
```javascript
// OLD: registrasi(nama, email, kataSandi)
// NEW: registrasi(email, kataSandi)

// Returns:
{
  pengguna: { id, email },
  token: jwt_token
}
```

#### **Login** - Simplified
```javascript
login(email, kataSandi)

// Security checks:
- Account lock check (adalahAkunDikunci)
- Password verification via bcrypt
- Failed attempt tracking
- Success: reset fail counter

// Returns:
{
  pengguna: { id, email },
  token: jwt_token
}
```

#### **ambilProfil** - Minimal data
```javascript
// Returns only:
{
  id: user._id,
  email: user.email
}
```

#### **Removed Functions:**
- ❌ `updateProfil()` - No profile updates needed

---

### 5. **Controllers & Routes**

#### Controller ([backend/src/kontroler/kontrolerPengguna.js](backend/src/kontroler/kontrolerPengguna.js))

**Simplified responses:**
- `registrasi()` - Returns only `{ id, email }`
- `login()` - Returns only `{ id, email }`
- `ambilProfil()` - Returns only `{ id, email }`
- `verifikasiToken()` - Returns only `{ id, email }`

**Removed:**
- ❌ `updateProfil()` - No profile update endpoint

#### Routes ([backend/src/rute/rutePengguna.js](backend/src/rute/rutePengguna.js))

**Kept endpoints:**
- ✅ `POST /api/pengguna/registrasi` - Email + password registration
- ✅ `POST /api/pengguna/login` - Email + password login
- ✅ `POST /api/pengguna/logout` - Session cleanup
- ✅ `GET /api/pengguna/verifikasi` - Token validation
- ✅ `GET /api/pengguna/profil` - Get user email (minimal)

**Removed endpoints:**
- ❌ `PUT /api/pengguna/profil` - No profile updates

---

### 6. **Frontend - No Profile/Settings Pages**

#### **Deleted Pages:**
- ❌ `frontend/app/dashboard/pengaturan/` - Settings page directory
- ❌ `frontend/komponen/formulir/PengaturanProfil.tsx` - Profile settings form
- ❌ `frontend/komponen/formulir/PengaturanNotifikasi.tsx` - Notification settings form

#### **Navigation** ([frontend/komponen/umum/NavigasiSidebar.tsx](frontend/komponen/umum/NavigasiSidebar.tsx))

**Menu items:**
- ✅ Dashboard
- ✅ Server
- ✅ Alert
- ✅ Chat AI
- ❌ Pengaturan (removed)

**No Settings icon import needed.**

---

### 7. **Login Form** ([frontend/komponen/formulir/FormulirMasuk.tsx](frontend/komponen/formulir/FormulirMasuk.tsx))

**Current validation:**
```typescript
const skemaMasuk = z.object({
  email: z.string().email('Email tidak valid'),
  kataSandi: z.string().min(6, 'Kata sandi minimal 6 karakter'),
})
```

✅ **Email and password only** - No additional fields.

---

## 📊 Summary Statistics

### Database Schema Reduction
- **Before**: 15+ fields (nama, statusAktif, terakhirLogin, peran, etc.)
- **After**: 5 core fields (email, kataSandi, security tracking, alert settings)
- **Reduction**: ~67% simpler

### JWT Payload Reduction
- **Before**: 4 fields (id, email, peran, nama)
- **After**: 2 fields (id, email)
- **Reduction**: 50% smaller tokens

### Deleted Files
1. `frontend/app/dashboard/pengaturan/` (directory)
2. `frontend/komponen/formulir/PengaturanProfil.tsx`
3. `frontend/komponen/formulir/PengaturanNotifikasi.tsx`

### Removed Code
- 3 model methods (password reset)
- 1 controller function (updateProfil)
- 1 service function (updateProfil)
- 1 route endpoint (PUT /profil)
- 4 schema indexes (peran, statusAktif, terakhirLogin)

---

## ✅ Verification Checklist

### Authentication Flow
- [x] Login requires only email + password
- [x] Registration requires only email + password
- [x] No profile data collected beyond email
- [x] Session tracks only user ID and email

### SMTP Integration
- [x] User email accessible to alert service
- [x] Email notification settings preserved
- [x] Alert service can query user email: `Pengguna.findById(server.pemilik).email`
- [x] SMTP sends to: `user.email` ✅

### Security
- [x] Password hashed with bcrypt (12 rounds)
- [x] Account lock after 5 failed attempts (30 min)
- [x] JWT tokens expire in 24 hours
- [x] HttpOnly cookies prevent XSS
- [x] SameSite strict prevents CSRF

### No Profile Features
- [x] No profile update pages
- [x] No settings navigation link
- [x] No profile update API endpoint
- [x] No nama field anywhere
- [x] No role/status tracking

---

## 🔒 Security Notes

### Preserved Security Features
1. **Brute Force Protection**: Account locks after 5 failed login attempts
2. **Password Hashing**: bcrypt with 12 salt rounds
3. **JWT Security**: Short expiration (24h), HttpOnly, SameSite strict
4. **Virtual Method**: `adalahAkunDikunci` checks lock status

### Removed Security Features (Not Needed)
- Email verification (not required for simple auth)
- Password reset tokens (can add back if needed)
- Account status tracking (single user type)

---

## 📝 Migration Notes

### Database Migration (if existing data)
If you have existing users in the database, consider:

1. **Drop unused fields** (optional, won't cause errors):
   ```javascript
   db.penggunas.updateMany({}, {
     $unset: {
       nama: "",
       statusAktif: "",
       terakhirLogin: "",
       dibuatPada: "",
       diperbaruiPada: "",
       peran: "",
       emailTerverifikasi: "",
       tokenVerifikasiEmail: "",
       tokenVerifikasiEmailExpired: "",
       statistikEmail: ""
     }
   })
   ```

2. **Ensure email exists** for all users (critical for SMTP):
   ```javascript
   db.penggunas.find({ email: { $exists: false } })
   // Should return 0 documents
   ```

---

## 🎯 Result

### Before Audit
- Complex user schema with 15+ fields
- Profile pages and settings
- Role-based access control
- Email verification system
- Profile update functionality

### After Audit ✅
- **Minimal schema**: Email + password + security + alert preferences
- **No profile features**: Just authentication
- **Single user type**: No roles or status
- **SMTP accessible**: Email available for server health alerts
- **Security intact**: Brute force protection, JWT, bcrypt

---

## Next Steps (Optional Enhancements)

If needed in the future, you can add:

1. **Password Reset**: Implement forgot password flow
2. **Email Verification**: Add verification for new registrations
3. **Two-Factor Auth**: Additional security layer
4. **Session Revocation**: Token blacklist for logout

But for now, the system is **simplified to its core**: email/password authentication with SMTP alert access. ✅
