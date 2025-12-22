# Server Health Monitoring System

A comprehensive monitoring system for server health with real-time metrics, AI-powered analysis, and automated alerting.

## 🚀 Features

- **Real-time Server Monitoring**: Continuous health metrics collection (CPU, Memory, Disk, Network)
- **AI-Powered Analysis**: Intelligent anomaly detection and predictive maintenance
- **Automated Alerting**: Email notifications for critical system events
- **Multi-user Authentication**: JWT-based authentication with role-based access control
- **WebSocket Communication**: Real-time dashboard updates
- **Comprehensive Logging**: Structured logging for system monitoring and debugging
- **RESTful API**: Well-documented API endpoints for all operations

## 🏗️ Architecture

### Backend (Node.js/Express)
```
src/
├── controllers/     # Request handlers
├── services/        # Business logic layer
├── models/         # Database models
├── routes/         # API route definitions
├── middleware/     # Express middleware
├── utils/          # Utility functions
├── config/         # Configuration files
└── socket/         # WebSocket handlers
```

### Frontend (Next.js/React)
```
app/
├── components/     # Reusable UI components
├── services/       # API client services
├── types/         # TypeScript type definitions
├── hooks/         # Custom React hooks
└── utils/         # Frontend utilities
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **Logging**: Winston
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Hooks
- **Real-time**: Socket.IO Client

### Development Tools
- **Testing**: Jest + Supertest
- **Linting**: ESLint
- **Formatting**: Prettier
- **Process Management**: Nodemon

## 📋 Prerequisites

- Node.js 18+
- MongoDB 5+
- npm or yarn

## 🚀 Quick Start

### Backend Setup

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/monitoring-server

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server
PORT=5001
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "namaPengguna": "johndoe",
  "email": "john@example.com",
  "kataSandi": "Password123",
  "konfirmasiKataSandi": "Password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "kataSandi": "Password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <access_token>
```

### Server Monitoring Endpoints

#### Get All Servers
```http
GET /api/servers
Authorization: Bearer <access_token>
```

#### Get Server Metrics
```http
GET /api/servers/:id/metrics
Authorization: Bearer <access_token>
```

#### Create Alert
```http
POST /api/alerts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "serverId": "server-id",
  "type": "cpu_high",
  "threshold": 80,
  "severity": "warning"
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### All Tests with Coverage
```bash
npm test
```

### Test Watch Mode
```bash
npm run test:watch
```

## 📊 Monitoring & Logging

### Log Files
- `logs/activity.log` - User activities and authentication
- `logs/security.log` - Security events
- `logs/system.log` - Server status and alerts
- `logs/ai.log` - AI interactions
- `logs/error.log` - Application errors
- `logs/performance.log` - Performance metrics

### Log Levels
- `error` - Error conditions
- `warn` - Warning conditions
- `info` - Informational messages
- `debug` - Debug information

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Password hashing** with bcrypt
- **Rate limiting** to prevent abuse
- **CORS protection**
- **Helmet security headers**
- **Input validation** and sanitization
- **SQL injection prevention** (MongoDB)

## 🤖 AI Integration

The system includes AI-powered features for:

- **Anomaly Detection**: Identify unusual server behavior
- **Predictive Maintenance**: Forecast potential issues
- **Smart Alerting**: Context-aware alert generation
- **Automated Analysis**: Generate insights from metrics data

## 📈 Performance Optimization

- **Database indexing** for efficient queries
- **Connection pooling** for database operations
- **Caching strategies** for frequently accessed data
- **Asynchronous processing** for heavy operations
- **Memory management** and garbage collection monitoring

## 🚦 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database connections tested
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring tools set up
- [ ] Backup procedures in place
- [ ] Log rotation configured

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation
- Use conventional commit messages

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues and solutions

## 🗺️ Roadmap

### Version 2.0
- [ ] Multi-tenant architecture
- [ ] Advanced AI analytics dashboard
- [ ] Mobile application
- [ ] Integration with cloud providers
- [ ] Custom metric definitions

### Version 1.5
- [ ] Enhanced alerting rules
- [ ] Historical data analysis
- [ ] Automated remediation scripts
- [ ] API rate limiting per user
- [ ] Advanced user permissions

---

**Built with ❤️ for reliable server monitoring**