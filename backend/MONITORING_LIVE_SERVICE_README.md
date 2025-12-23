# Monitoring Live Service - Manual Override for Testing

## Overview

The Monitoring Live Service provides **automated simulation** (updates every 3 seconds) and **manual override** capability to test alert triggers. Perfect for demos and presentations where you need to inject specific metric values instantly.

---

## Architecture

### Global State Management

The service maintains a centralized state object:

```javascript
{
  serverId: {
    cpu: 45.2,
    ram: 67.8,
    disk: 23.4,
    temperature: 55.0,
    timestamp: "2025-12-23T...",
    isOverride: false,
    lastUpdate: 1703334567890
  }
}
```

### Automated Loop (3 Seconds)

- Runs continuously in the background
- Updates all metrics with small randomization (±2%)
- Provides realistic "live" data feel
- Automatically pauses when override is active

### Override Protection

When you inject manual values:
- Override lock is set for **2 minutes** (configurable)
- Automated loop skips that server during lock period
- Values remain stable for your demo/test
- Lock automatically expires after duration

---

## API Endpoints

### 1. GET Current Health Status

**Endpoint:** `GET /api/monitoring-live/health`

**Query Parameters:**
- `serverId` (optional) - Get metrics for specific server

**Response:**
```json
{
  "success": true,
  "message": "Current monitoring state retrieved",
  "data": {
    "server-123": {
      "cpu": 45.2,
      "ram": 67.8,
      "disk": 23.4,
      "temperature": 55.0,
      "timestamp": "2025-12-23T10:30:00.000Z",
      "isOverride": false,
      "isLocked": false,
      "lockedUntil": null,
      "lastUpdate": 1703334567890
    }
  },
  "timestamp": "2025-12-23T10:30:00.000Z"
}
```

**Usage:**
```bash
# Get all servers
curl -X GET "http://localhost:5001/api/monitoring-live/health" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific server
curl -X GET "http://localhost:5001/api/monitoring-live/health?serverId=server-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. POST Manual Override (Inject Values)

**Endpoint:** `POST /api/monitoring-live/override`

**Body:**
```json
{
  "serverId": "server-123",
  "cpu": 99,
  "temperature": 90,
  "lockDuration": 120000
}
```

**Fields:**
- `serverId` (required) - Server ID to override
- `cpu` (optional, 0-100) - CPU usage percentage
- `ram` (optional, 0-100) - RAM usage percentage
- `disk` (optional, 0-100) - Disk usage percentage
- `temperature` (optional, 0-100) - Temperature in celsius
- `lockDuration` (optional, milliseconds) - Override lock duration (default: 2 minutes)

**Response:**
```json
{
  "success": true,
  "message": "Override applied successfully",
  "data": {
    "success": true,
    "metrics": {
      "cpu": 99,
      "ram": 67.8,
      "disk": 23.4,
      "temperature": 90
    },
    "lockedUntil": "2025-12-23T10:32:00.000Z"
  },
  "timestamp": "2025-12-23T10:30:00.000Z"
}
```

**Usage Examples:**

```bash
# Inject high CPU and temperature (danger zone)
curl -X POST "http://localhost:5001/api/monitoring-live/override" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serverId": "server-123",
    "cpu": 99,
    "temperature": 90
  }'

# Inject all metrics
curl -X POST "http://localhost:5001/api/monitoring-live/override" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serverId": "server-123",
    "cpu": 95,
    "ram": 98,
    "disk": 92,
    "temperature": 88
  }'

# Custom lock duration (5 minutes)
curl -X POST "http://localhost:5001/api/monitoring-live/override" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serverId": "server-123",
    "cpu": 99,
    "lockDuration": 300000
  }'
```

---

### 3. DELETE Clear Override

**Endpoint:** `DELETE /api/monitoring-live/override/:serverId`

**Response:**
```json
{
  "success": true,
  "message": "Override cleared successfully",
  "serverId": "server-123",
  "timestamp": "2025-12-23T10:30:00.000Z"
}
```

**Usage:**
```bash
curl -X DELETE "http://localhost:5001/api/monitoring-live/override/server-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. GET Service Status

**Endpoint:** `GET /api/monitoring-live/status`

**Response:**
```json
{
  "success": true,
  "message": "Monitoring service status",
  "data": {
    "isRunning": true,
    "totalServers": 3,
    "activeLocks": 1,
    "updateInterval": 3000,
    "lockDuration": 120000
  },
  "timestamp": "2025-12-23T10:30:00.000Z"
}
```

---

### 5. POST Start/Stop Loop

**Endpoints:**
- `POST /api/monitoring-live/start` - Start automated loop
- `POST /api/monitoring-live/stop` - Stop automated loop

**Usage:**
```bash
# Start loop
curl -X POST "http://localhost:5001/api/monitoring-live/start" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Stop loop
curl -X POST "http://localhost:5001/api/monitoring-live/stop" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Demo/Testing Workflow

### Scenario 1: Show Normal to Critical Transition

```bash
# Step 1: Start with normal metrics (optional - already automated)
# Dashboard shows green/healthy

# Step 2: Just before demo, inject critical values
curl -X POST "http://localhost:5001/api/monitoring-live/override" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serverId": "server-123",
    "cpu": 99,
    "temperature": 92
  }'

# Step 3: Show dashboard - alerts trigger immediately
# Professor sees red alerts, email notifications, etc.

# Step 4: After demo, clear override
curl -X DELETE "http://localhost:5001/api/monitoring-live/override/server-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Scenario 2: Test Alert Thresholds

```bash
# Test WARNING threshold (CPU 70-80%)
curl -X POST "http://localhost:5001/api/monitoring-live/override" \
  -d '{"serverId": "server-123", "cpu": 75}' \
  -H "Authorization: Bearer TOKEN"

# Wait, observe alerts

# Test CRITICAL threshold (CPU 85-95%)
curl -X POST "http://localhost:5001/api/monitoring-live/override" \
  -d '{"serverId": "server-123", "cpu": 90}' \
  -H "Authorization: Bearer TOKEN"

# Test DANGER threshold (CPU 96-100%)
curl -X POST "http://localhost:5001/api/monitoring-live/override" \
  -d '{"serverId": "server-123", "cpu": 99}' \
  -H "Authorization: Bearer TOKEN"
```

---

## Integration with Frontend

### Fetching Live Metrics

```typescript
// Frontend service example
async function getLiveMetrics(serverId?: string) {
  const url = serverId 
    ? `/api/monitoring-live/health?serverId=${serverId}`
    : '/api/monitoring-live/health';
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

// Inject override for testing
async function injectDangerMetrics(serverId: string) {
  const response = await fetch('/api/monitoring-live/override', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      serverId,
      cpu: 99,
      temperature: 90,
      ram: 95
    })
  });
  
  return await response.json();
}
```

---

## Configuration

### Environment Variables

```env
# No specific env vars needed - uses defaults
# But you can customize in the service if needed:

MONITORING_UPDATE_INTERVAL=3000     # 3 seconds
MONITORING_OVERRIDE_LOCK=120000     # 2 minutes
```

### Customizing in Code

Edit `backend/src/layanan/layananMonitoringLive.js`:

```javascript
this.updateIntervalMs = 3000; // Change to 5000 for 5s updates
this.overrideLockDuration = 5 * 60 * 1000; // Change to 5 minutes
```

---

## Alert Integration

The override values will automatically:
1. ✅ Update global state immediately
2. ✅ Trigger alert evaluation (if integrated with layananAlert)
3. ✅ Send SMTP emails if thresholds exceeded
4. ✅ Show red status in dashboard
5. ✅ Generate Socket.IO events for real-time updates

---

## Troubleshooting

### Override Not Working?

```bash
# Check service status
curl -X GET "http://localhost:5001/api/monitoring-live/status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify loop is running
# isRunning should be true
```

### Values Not Updating?

```bash
# Check if server is locked
# Get health - check isLocked and lockedUntil

# Clear override manually
curl -X DELETE "http://localhost:5001/api/monitoring-live/override/server-123"
```

### Loop Not Starting?

```bash
# Manually start loop
curl -X POST "http://localhost:5001/api/monitoring-live/start" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Best Practices

1. **Before Demo:**
   - Test override 5 minutes before presentation
   - Verify alerts are working
   - Prepare curl command or Postman request

2. **During Demo:**
   - Use short lock duration (1-2 minutes)
   - Have clear override command ready
   - Show before/after dashboard states

3. **After Demo:**
   - Clear overrides immediately
   - Let automated loop resume
   - Check system returns to normal

4. **For Development:**
   - Use longer lock durations (5+ minutes)
   - Test all threshold levels
   - Verify alert logic triggers correctly

---

## Security Notes

- ⚠️ **Authentication Required:** All endpoints need valid JWT token
- ⚠️ **Rate Limiting:** Consider adding rate limits to override endpoint
- ⚠️ **Audit Logging:** All override actions are logged with user ID
- ⚠️ **Production Use:** Disable or restrict override endpoint in production

---

## Summary

The Monitoring Live Service provides a powerful testing framework for your monitoring system:
- **Automated:** 3-second updates keep data feeling "live"
- **Controllable:** Manual override for precise testing
- **Protected:** Override locks prevent automated interference
- **Integrated:** Works seamlessly with alerts and dashboard

Perfect for demos, testing, and development! 🚀
