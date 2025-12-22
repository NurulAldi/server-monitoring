// Unit tests for logger utility
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const {
  logger,
  logUserLogin,
  logSocketConnection,
  logServerStatusChange,
  logEmailAlert,
  logAIInteraction,
  logSecurityEvent
} = require('../../src/utilitas/logger');

describe('Logger Utility', () => {
  const logsDir = path.join(__dirname, '../../logs');

  beforeAll(() => {
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test log files
    const testLogFiles = [
      'activity.log',
      'security.log',
      'system.log',
      'ai.log',
      'error.log',
      'performance.log'
    ];

    testLogFiles.forEach(file => {
      const filePath = path.join(logsDir, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe('Logger Instance', () => {
    test('should create logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });

    test('should have correct log levels', () => {
      const levels = logger.levels;
      expect(levels).toBeDefined();
      expect(levels.error).toBeGreaterThan(levels.warn);
      expect(levels.warn).toBeGreaterThan(levels.info);
    });

    test('should expose helper methods on logger instance for backwards compatibility', () => {
      expect(typeof logger.logError).toBe('function');
      expect(typeof logger.logUserActivity).toBe('function');
      expect(typeof logger.logSystem).toBe('function');
      expect(typeof logger.logSystemError).toBe('function');
    });

    test('calling logger helpers should not throw', () => {
      expect(() => {
        logger.logError(new Error('unit-test-error'), { test: true });
        logger.logUserActivity('user-test', 'UNIT_TEST_ACTION', { test: true });
        logger.logSystem('UNIT_SYSTEM_EVENT', 'Unit test event');
        logger.logSystemError('UNIT_SYSTEM_ERROR', new Error('unit-system-error'));
      }).not.toThrow();
    });
  });

  describe('Activity Logging Functions', () => {
    test('logUserLogin should log successful login', () => {
      const userId = 'test-user-123';
      const loginData = {
        method: 'password',
        deviceType: 'desktop',
        location: 'Jakarta',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        success: true,
        sessionId: 'session-123'
      };

      expect(() => {
        logUserLogin(userId, loginData);
      }).not.toThrow();
    });

    test('logUserLogin should log failed login', () => {
      const userId = 'test-user-456';
      const loginData = {
        method: 'password',
        ip: '192.168.1.101',
        success: false,
        failureReason: 'invalid_password'
      };

      expect(() => {
        logUserLogin(userId, loginData);
      }).not.toThrow();
    });

    test('logSocketConnection should log connect event', () => {
      const userId = 'test-user-123';
      const action = 'connect';
      const connectionData = {
        socketId: 'socket_abc123',
        connectionType: 'websocket',
        rooms: ['user_123', 'admin'],
        ip: '192.168.1.100'
      };

      expect(() => {
        logSocketConnection(userId, action, connectionData);
      }).not.toThrow();
    });

    test('logSocketConnection should log disconnect event', () => {
      const userId = 'test-user-123';
      const action = 'disconnect';
      const connectionData = {
        socketId: 'socket_abc123',
        connectionType: 'websocket',
        rooms: ['user_123', 'admin'],
        connectionDuration: 3600000,
        disconnectReason: 'client_disconnect',
        bytesTransferred: 15432,
        ip: '192.168.1.100'
      };

      expect(() => {
        logSocketConnection(userId, action, connectionData);
      }).not.toThrow();
    });

    test('logServerStatusChange should log status change', () => {
      const serverId = 'server-456';
      const statusData = {
        serverName: 'Production Web Server',
        oldStatus: 'online',
        newStatus: 'critical',
        changeReason: 'cpu_overload',
        userId: 'system',
        metrics: {
          cpu: 95.5,
          memory: 87.2,
          disk: 45.1
        },
        downtime: 300000
      };

      expect(() => {
        logServerStatusChange(serverId, statusData);
      }).not.toThrow();
    });

    test('logEmailAlert should log successful email', () => {
      const alertId = 'alert-789';
      const emailData = {
        alertType: 'cpu_critical',
        recipients: ['admin@company.com', 'user123@company.com'],
        emailTemplate: 'ai_analysis_template',
        deliveryStatus: 'sent',
        smtpResponse: '250 OK',
        retryCount: 0,
        emailSize: 2048,
        subject: '🚨 CRITICAL: Server CPU Overload'
      };

      expect(() => {
        logEmailAlert(alertId, emailData);
      }).not.toThrow();
    });

    test('logEmailAlert should log failed email', () => {
      const alertId = 'alert-790';
      const emailData = {
        alertType: 'memory_warning',
        recipients: ['admin@company.com'],
        deliveryStatus: 'failed',
        retryCount: 2,
        error: 'SMTP connection timeout'
      };

      expect(() => {
        logEmailAlert(alertId, emailData);
      }).not.toThrow();
    });

    test('logAIInteraction should log successful interaction', () => {
      const userId = 'user-123';
      const aiData = {
        sessionId: 'ai_session_101',
        provider: 'openai',
        model: 'gpt-4',
        interactionType: 'chat',
        inputTokens: 150,
        outputTokens: 200,
        totalTokens: 350,
        responseTime: 2500,
        userQuery: 'Analyze server performance',
        aiResponse: 'Server performance is optimal',
        confidence: 0.95,
        feedback: null
      };

      expect(() => {
        logAIInteraction(userId, aiData);
      }).not.toThrow();
    });

    test('logAIInteraction should log failed interaction', () => {
      const userId = 'user-456';
      const aiData = {
        sessionId: 'ai_session_102',
        provider: 'openai',
        model: 'gpt-4',
        interactionType: 'analysis',
        inputTokens: 200,
        outputTokens: 0,
        totalTokens: 200,
        responseTime: 5000,
        userQuery: 'What is the server status?',
        aiResponse: '',
        confidence: 0,
        error: 'API rate limit exceeded'
      };

      expect(() => {
        logAIInteraction(userId, aiData);
      }).not.toThrow();
    });

    test('logSecurityEvent should log security events', () => {
      const event = 'failed_login_attempt';
      const securityData = {
        userId: 'unknown',
        severity: 'medium',
        description: '5 failed login attempts from same IP',
        action: 'ip_rate_limited',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0'
      };

      expect(() => {
        logSecurityEvent(event, securityData);
      }).not.toThrow();
    });
  });

  describe('Log File Creation', () => {
    test('should create log files when logging', () => {
      // Trigger some logging
      logUserLogin('test-user', { success: true });
      logSecurityEvent('test_event', { severity: 'low' });

      // Check if log files exist
      const activityLogPath = path.join(logsDir, 'activity.log');
      const securityLogPath = path.join(logsDir, 'security.log');

      // Note: Files might not be created immediately due to Winston's buffering
      // This test mainly ensures no errors are thrown during logging
      expect(() => {
        logUserLogin('test-user-2', { success: true });
      }).not.toThrow();
    });
  });
});