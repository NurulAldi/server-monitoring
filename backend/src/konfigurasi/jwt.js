// Konfigurasi JWT (JSON Web Token) untuk autentikasi
// Menggunakan jsonwebtoken library

const jwt = require('jsonwebtoken');

// Ambil JWT secret dari environment variable
const JWT_SECRET = process.env.JWT_SECRET;

// Validasi JWT secret
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET tidak ditemukan di environment variable');
}

if (JWT_SECRET.length < 32) {
  console.warn('⚠️  Peringatan: JWT_SECRET kurang dari 32 karakter. Gunakan secret yang lebih kuat untuk production.');
}

// Konfigurasi token expiration
const TOKEN_EXPIRATION = '24h'; // Token berlaku 24 jam

// Konfigurasi cookie untuk JWT
const COOKIE_OPTIONS = {
  httpOnly: true, // JavaScript tidak bisa akses cookie (cegah XSS)
  secure: process.env.NODE_ENV === 'production', // HTTPS only di production
  sameSite: 'strict', // Cegah CSRF attack
  maxAge: 24 * 60 * 60 * 1000, // 24 jam dalam milliseconds
  path: '/' // Cookie berlaku untuk semua path
};

// Fungsi untuk generate JWT token
function generateToken(payload) {
  try {
    // Payload yang akan disimpan di token
    const tokenPayload = {
      id: payload._id || payload.id, // ID user dari database
      email: payload.email,
      peran: payload.peran || 'user', // Default role 'user'
      iat: Math.floor(Date.now() / 1000), // Issued at timestamp
    };

    // Generate token dengan secret dan expiration
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION,
      issuer: 'monitoring-server', // Issuer identifier
      audience: 'monitoring-client' // Audience identifier
    });

    return token;
  } catch (error) {
    console.error('❌ Error generate JWT token:', error.message);
    throw new Error('Gagal generate token autentikasi');
  }
}

// Fungsi untuk verify JWT token
function verifyToken(token) {
  try {
    // Verify token dengan secret
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'monitoring-server',
      audience: 'monitoring-client'
    });

    // Return decoded payload
    return {
      id: decoded.id,
      email: decoded.email,
      peran: decoded.peran,
      iat: decoded.iat,
      exp: decoded.exp
    };
  } catch (error) {
    // Handle berbagai jenis error JWT
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token sudah expired. Silakan login ulang.');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token tidak valid.');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token belum aktif.');
    } else {
      console.error('❌ Error verify JWT token:', error.message);
      throw new Error('Token autentikasi tidak valid');
    }
  }
}

// Fungsi untuk decode token tanpa verify (untuk debugging)
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('❌ Error decode JWT token:', error.message);
    return null;
  }
}

// Fungsi untuk generate refresh token (opsional, untuk future enhancement)
function generateRefreshToken(payload) {
  try {
    const refreshPayload = {
      id: payload._id || payload.id,
      type: 'refresh', // Identifier untuk refresh token
      iat: Math.floor(Date.now() / 1000),
    };

    // Refresh token berlaku lebih lama (7 hari)
    const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'monitoring-server',
      audience: 'monitoring-client'
    });

    return refreshToken;
  } catch (error) {
    console.error('❌ Error generate refresh token:', error.message);
    throw new Error('Gagal generate refresh token');
  }
}

// Fungsi untuk verify refresh token
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'monitoring-server',
      audience: 'monitoring-client'
    });

    // Pastikan ini adalah refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Token bukan refresh token');
    }

    return decoded;
  } catch (error) {
    console.error('❌ Error verify refresh token:', error.message);
    throw new Error('Refresh token tidak valid');
  }
}

// Export semua fungsi dan konstanta
module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateRefreshToken,
  verifyRefreshToken,
  COOKIE_OPTIONS,
  TOKEN_EXPIRATION
};