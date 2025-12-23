// Authentication service - Business logic for authentication operations
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Pengguna = require('../model/Pengguna');
const layananEmail = require('../layanan/layananEmail');
const { logUserLogin } = require('../utilitas/logger');
const { ERROR_CODE } = require('../utilitas/konstanta');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, kataSandi, ip, userAgent } = userData;

    // Check if email already exists
    const existingUser = await Pengguna.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email sudah terdaftar');
    }

    // Hash password
    const saltRounds = 12;
    const kataSandiHash = await bcrypt.hash(kataSandi, saltRounds);

    // Generate email verification token
    const tokenVerifikasi = this.generateEmailVerificationToken(email);

    // Create new user
    const penggunaBaru = new Pengguna({
      email: email.toLowerCase(),
      kataSandiHash,
      peran: 'user',
      statusAktif: false,
      emailTerverifikasi: false,
      tokenVerifikasi,
      dibuatPada: new Date(),
      diperbaruiPada: new Date()
    });

    await penggunaBaru.save();

    // Send verification email
    try {
      await layananEmail.kirimEmailVerifikasi(email, null, tokenVerifikasi);
    } catch (emailError) {
      // Log email error but don't fail registration
      console.error('Failed to send verification email:', emailError);
    }

    return {
      user: {
        id: penggunaBaru._id,
        email: penggunaBaru.email,
        peran: penggunaBaru.peran
      },
      requiresVerification: true
    };
  }

  /**
   * Authenticate user login
   */
  async login(credentials, requestInfo = {}) {
    const { email, kataSandi } = credentials;
    const { ip, userAgent } = requestInfo;

    // Find user by email
    const pengguna = await Pengguna.findOne({ email: email.toLowerCase() });
    if (!pengguna) {
      await logUserLogin(email, {
        method: 'password',
        ip,
        success: false,
        failureReason: 'user_not_found'
      });
      throw new Error('Email atau password salah');
    }

    // Check if account is active
    if (!pengguna.statusAktif) {
      await logUserLogin(pengguna._id, {
        method: 'password',
        ip,
        success: false,
        failureReason: 'account_inactive'
      });
      throw new Error('Akun belum diaktifkan');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(kataSandi, pengguna.kataSandiHash);
    if (!isPasswordValid) {
      await logUserLogin(pengguna._id, {
        method: 'password',
        ip,
        success: false,
        failureReason: 'invalid_password'
      });
      throw new Error('Email atau password salah');
    }

    // Generate tokens
    const tokens = this.generateTokens(pengguna);

    // Update last login
    pengguna.terakhirLogin = new Date();
    pengguna.diperbaruiPada = new Date();
    await pengguna.save();

    // Log successful login
    await logUserLogin(pengguna._id, {
      method: 'password',
      deviceType: this.getDeviceType(userAgent),
      location: 'Unknown', // Could be enhanced with IP geolocation
      ip,
      userAgent,
      success: true,
      sessionId: tokens.sessionId
    });

    return {
      user: {
        id: pengguna._id,
        email: pengguna.email,
        peran: pengguna.peran,
        avatar: pengguna.avatar,
        terakhirLogin: pengguna.terakhirLogin
      },
      tokens
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Debug logging for tests
      const { logger } = require('../utilitas/logger');
      logger.error('verifyEmail decoded', { decoded });

      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      const pengguna = await Pengguna.findOne({
        email: decoded.email,
        tokenVerifikasi: token
      });

      logger.error('verifyEmail found pengguna', { found: !!pengguna, penggunaId: pengguna?._id });

      if (!pengguna) {
        throw new Error('Invalid or expired token');
      }

      // Update user status
      pengguna.emailTerverifikasi = true;
      pengguna.statusAktif = true;
      pengguna.tokenVerifikasi = null;
      pengguna.diperbaruiPada = new Date();

      await pengguna.save();

      return {
        success: true,
        message: 'Email berhasil diverifikasi',
        user: {
          id: pengguna._id,
          email: pengguna.email
        }
      };

    } catch (error) {
      throw new Error('Token verifikasi tidak valid atau sudah expired');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

      const pengguna = await Pengguna.findById(decoded.userId);
      if (!pengguna || !pengguna.statusAktif) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          userId: pengguna._id,
          email: pengguna.email,
          role: pengguna.peran,
          sessionId: decoded.sessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return {
        accessToken: newAccessToken,
        tokenType: 'Bearer',
        expiresIn: 900 // 15 minutes
      };

    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(userId) {
    // In a more complex system, you might want to blacklist tokens
    // For now, we just log the logout
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user) {
    const sessionId = crypto.randomUUID();

    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.peran,
        sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user._id,
        sessionId
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer'
    };
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(email) {
    return jwt.sign(
      { email, type: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Get device type from user agent
   */
  getDeviceType(userAgent = '') {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, oldPassword, newPassword) {
    const pengguna = await Pengguna.findById(userId);
    if (!pengguna) {
      throw new Error('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, pengguna.kataSandiHash);
    if (!isOldPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    pengguna.kataSandiHash = newPasswordHash;
    pengguna.diperbaruiPada = new Date();
    await pengguna.save();

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const pengguna = await Pengguna.findOne({ email: email.toLowerCase() });
    if (!pengguna) {
      // Don't reveal if email exists or not
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: pengguna._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save reset token
    pengguna.resetToken = resetToken;
    pengguna.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    await pengguna.save();

    // Send reset email
    try {
      await layananEmail.kirimEmailResetPassword(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      const pengguna = await Pengguna.findOne({
        _id: decoded.userId,
        resetToken: token,
        resetTokenExpires: { $gt: new Date() }
      });

      if (!pengguna) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      pengguna.kataSandiHash = newPasswordHash;
      pengguna.resetToken = null;
      pengguna.resetTokenExpires = null;
      pengguna.diperbaruiPada = new Date();
      await pengguna.save();

      return { success: true, message: 'Password reset successfully' };

    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }
}

module.exports = new AuthService();