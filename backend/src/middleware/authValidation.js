// Authentication validation middleware
const { body, validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_CODE, VALIDATION_RULES } = require('../utilitas/konstanta');

class AuthValidation {
  /**
   * Handle validation errors
   */
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODE.VALIDATION_ERROR,
          message: 'Validation failed',
          details: errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
          })),
          timestamp: new Date().toISOString()
        }
      });
    }
    next();
  }

  /**
   * Registration validation rules
   */
  validateRegistration() {
    return [
      body('namaPengguna')
        .trim()
        .isLength({
          min: VALIDATION_RULES.USERNAME_MIN_LENGTH,
          max: VALIDATION_RULES.USERNAME_MAX_LENGTH
        })
        .withMessage(`Username must be between ${VALIDATION_RULES.USERNAME_MIN_LENGTH} and ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters`)
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

      body('kataSandi')
        .isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH })
        .withMessage(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

      body('konfirmasiKataSandi')
        .custom((value, { req }) => {
          if (value !== req.body.kataSandi) {
            throw new Error('Password confirmation does not match password');
          }
          return true;
        }),

      this.handleValidationErrors
    ];
  }

  /**
   * Login validation rules
   */
  validateLogin() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

      body('kataSandi')
        .notEmpty()
        .withMessage('Password is required'),

      this.handleValidationErrors
    ];
  }

  /**
   * Email verification validation rules
   */
  validateEmailVerification() {
    return [
      body('token')
        .notEmpty()
        .withMessage('Verification token is required')
        .isLength({ min: 10 })
        .withMessage('Invalid verification token'),

      this.handleValidationErrors
    ];
  }

  /**
   * Password reset request validation rules
   */
  validatePasswordResetRequest() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

      this.handleValidationErrors
    ];
  }

  /**
   * Password reset validation rules
   */
  validatePasswordReset() {
    return [
      body('token')
        .notEmpty()
        .withMessage('Reset token is required'),

      body('kataSandi')
        .isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH })
        .withMessage(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

      body('konfirmasiKataSandi')
        .custom((value, { req }) => {
          if (value !== req.body.kataSandi) {
            throw new Error('Password confirmation does not match password');
          }
          return true;
        }),

      this.handleValidationErrors
    ];
  }

  /**
   * Change password validation rules
   */
  validateChangePassword() {
    return [
      body('kataSandiLama')
        .notEmpty()
        .withMessage('Current password is required'),

      body('kataSandiBaru')
        .isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH })
        .withMessage(`New password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),

      body('konfirmasiKataSandiBaru')
        .custom((value, { req }) => {
          if (value !== req.body.kataSandiBaru) {
            throw new Error('Password confirmation does not match new password');
          }
          return true;
        }),

      this.handleValidationErrors
    ];
  }

  /**
   * Token refresh validation rules
   */
  validateTokenRefresh() {
    return [
      body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),

      this.handleValidationErrors
    ];
  }
}

module.exports = new AuthValidation();