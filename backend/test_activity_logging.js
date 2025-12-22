// Test Activity Logging System
// Menguji semua method logging untuk memastikan berfungsi dengan benar

const {
  logUserLogin,
  logSocketConnection,
  logServerStatusChange,
  logEmailAlert,
  logAIInteraction,
  logSecurityEvent
} = require('./utilitas/logger');

console.log('Testing Activity Logging System...\n');

// Test 1: User Login
console.log('1. Testing User Login Logging...');
logUserLogin('user123', {
  method: 'password',
  deviceType: 'desktop',
  location: 'Jakarta',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0',
  success: true,
  sessionId: 'session123'
});

logUserLogin('user456', {
  method: 'password',
  deviceType: 'mobile',
  ip: '192.168.1.101',
  success: false,
  failureReason: 'invalid_password'
});

// Test 2: Socket Connection
console.log('2. Testing Socket Connection Logging...');
logSocketConnection('user123', 'connect', {
  socketId: 'socket_abc123',
  connectionType: 'websocket',
  rooms: ['user_123', 'admin'],
  ip: '192.168.1.100'
});

logSocketConnection('user123', 'disconnect', {
  socketId: 'socket_abc123',
  connectionType: 'websocket',
  rooms: ['user_123', 'admin'],
  connectionDuration: 3600000,
  disconnectReason: 'client_disconnect',
  bytesTransferred: 15432
});

// Test 3: Server Status Change
console.log('3. Testing Server Status Change Logging...');
logServerStatusChange('server456', {
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
});

// Test 4: Email Alert
console.log('4. Testing Email Alert Logging...');
logEmailAlert('alert789', {
  alertType: 'cpu_critical',
  recipients: ['admin@company.com', 'user123@company.com'],
  emailTemplate: 'ai_analysis_template',
  deliveryStatus: 'sent',
  smtpResponse: '250 OK',
  retryCount: 0,
  emailSize: 2048,
  subject: '🚨 CRITICAL: Server CPU Overload'
});

logEmailAlert('alert790', {
  alertType: 'memory_warning',
  recipients: ['admin@company.com'],
  deliveryStatus: 'failed',
  retryCount: 2,
  error: 'SMTP connection timeout'
});

// Test 5: AI Interaction
console.log('5. Testing AI Interaction Logging...');
logAIInteraction('user123', {
  sessionId: 'ai_session_101',
  provider: 'openai',
  model: 'gpt-4',
  interactionType: 'chat',
  inputTokens: 150,
  outputTokens: 200,
  totalTokens: 350,
  responseTime: 2500,
  userQuery: 'Analyze server performance',
  aiResponse: 'Server performance is optimal with CPU at 45% and memory at 60%',
  confidence: 0.95,
  feedback: null
});

logAIInteraction('user456', {
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
});

// Test 6: Security Event
console.log('6. Testing Security Event Logging...');
logSecurityEvent('failed_login_attempt', {
  userId: 'unknown',
  severity: 'medium',
  description: '5 failed login attempts from same IP',
  action: 'ip_rate_limited',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0'
});

logSecurityEvent('suspicious_activity', {
  userId: 'user123',
  severity: 'high',
  description: 'Multiple rapid API calls detected',
  action: 'account_temporarily_locked',
  ip: '192.168.1.100'
});

console.log('\n✅ Activity Logging Test Completed!');
console.log('Check the following log files:');
console.log('- logs/activity.log (authentication & socket events)');
console.log('- logs/security.log (security events)');
console.log('- logs/system.log (server status & alerts)');
console.log('- logs/ai.log (AI interactions)');
console.log('- logs/error.log (any errors during logging)');