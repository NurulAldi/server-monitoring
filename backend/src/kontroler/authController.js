// Authentication controller - Clean controllers using service layer
const { HTTP_STATUS, ERROR_CODE } = require('../utilitas/konstanta');
const { logger } = require('../utilitas/logger');
const authService = require('../layanan/authService');
const authValidation = require('../middleware/authValidation');

class AuthController {
  /**
   * Register new user
   */
  async register(req, res) {
    try {
      const { namaPengguna, email, kataSandi } = req.body;
      const clientInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      logger.info('User registration attempt', {
        email,
        username: namaPengguna,
        ip: clientInfo.ip
      });

      const result = await authService.register({
        namaPengguna,
        email,
        kataSandi,
        ...clientInfo
      });

      logger.info('User registration successful', {
        userId: result.user.id,
        email: result.user.email
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('User registration failed', {
        error: error.message,
        email: req.body.email,
        ip: req.ip
      });

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.VALIDATION_ERROR,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * User login
   */
  async login(req, res) {
    try {
      const { email, kataSandi } = req.body;
      const clientInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      logger.info('User login attempt', {
        email,
        ip: clientInfo.ip
      });

      const result = await authService.login(
        { email, kataSandi },
        clientInfo
      );

      logger.info('User login successful', {
        userId: result.user.id,
        email: result.user.email,
        ip: clientInfo.ip
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('User login failed', {
        error: error.message,
        email: req.body.email,
        ip: req.ip
      });

      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.AUTHENTICATION_FAILED,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      logger.info('Email verification attempt', { token: token.substring(0, 10) + '...' });

      const result = await authService.verifyEmail(token);

      logger.info('Email verification successful', {
        userId: result.user.id,
        email: result.user.email
      });

      res.json({
        success: true,
        message: result.message,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Email verification failed', {
        error: error.message,
        token: req.body.token?.substring(0, 10) + '...'
      });

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_TOKEN,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      logger.info('Token refresh attempt', {
        userId: req.user?.userId,
        ip: req.ip
      });

      const result = await authService.refreshToken(refreshToken);

      logger.info('Token refresh successful', {
        userId: req.user?.userId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Token refresh failed', {
        error: error.message,
        userId: req.user?.userId,
        ip: req.ip
      });

      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_TOKEN,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Logout user
   */
  async logout(req, res) {
    try {
      const userId = req.user?.userId;

      logger.info('User logout', {
        userId,
        ip: req.ip
      });

      const result = await authService.logout(userId);

      res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Logout error', {
        error: error.message,
        userId: req.user?.userId,
        ip: req.ip
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODE.INTERNAL_ERROR,
          message: 'Logout failed',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      logger.info('Password reset request', {
        email,
        ip: req.ip
      });

      const result = await authService.requestPasswordReset(email);

      // Don't log success details for security
      res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Password reset request failed', {
        error: error.message,
        email: req.body.email,
        ip: req.ip
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODE.INTERNAL_ERROR,
          message: 'Failed to process password reset request',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req, res) {
    try {
      const { token, kataSandi } = req.body;

      logger.info('Password reset attempt', {
        token: token.substring(0, 10) + '...',
        ip: req.ip
      });

      const result = await authService.resetPassword(token, kataSandi);

      logger.info('Password reset successful', {
        ip: req.ip
      });

      res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Password reset failed', {
        error: error.message,
        ip: req.ip
      });

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.INVALID_TOKEN,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { kataSandiLama, kataSandiBaru } = req.body;

      logger.info('Password change attempt', {
        userId,
        ip: req.ip
      });

      const result = await authService.changePassword(userId, kataSandiLama, kataSandiBaru);

      logger.info('Password change successful', {
        userId,
        ip: req.ip
      });

      res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Password change failed', {
        error: error.message,
        userId: req.user?.userId,
        ip: req.ip
      });

      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.VALIDATION_ERROR,
          message: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      // Get user from service (you might want to add this to authService)
      const Pengguna = require('../model/Pengguna');
      const user = await Pengguna.findById(userId).select('-kataSandiHash -resetToken -resetTokenExpires');

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: ERROR_CODE.NOT_FOUND,
            message: 'User not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            namaPengguna: user.namaPengguna,
            email: user.email,
            peran: user.peran,
            avatar: user.avatar,
            statusAktif: user.statusAktif,
            emailTerverifikasi: user.emailTerverifikasi,
            terakhirLogin: user.terakhirLogin,
            dibuatPada: user.dibuatPada,
            diperbaruiPada: user.diperbaruiPada
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get profile failed', {
        error: error.message,
        userId: req.user?.userId
      });

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODE.INTERNAL_ERROR,
          message: 'Failed to get user profile',
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

// Create controller instance
const authController = new AuthController();

// Validation middleware
authController.validateRegistration = authValidation.validateRegistration();
authController.validateLogin = authValidation.validateLogin();
authController.validateEmailVerification = authValidation.validateEmailVerification();
authController.validatePasswordResetRequest = authValidation.validatePasswordResetRequest();
authController.validatePasswordReset = authValidation.validatePasswordReset();
authController.validateChangePassword = authValidation.validateChangePassword();
authController.validateTokenRefresh = authValidation.validateTokenRefresh();

module.exports = authController;