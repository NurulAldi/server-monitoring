// Logger sederhana untuk frontend
type TingkatLog = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: TingkatLog
  message: string
  data?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: TingkatLog, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    if (data) {
      return `${prefix} ${message}`, data
    }

    return `${prefix} ${message}`
  }

  private log(level: TingkatLog, message: string, data?: any) {
    if (!this.isDevelopment && level === 'debug') return

    const formattedMessage = this.formatMessage(level, message, data)

    switch (level) {
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        break
      case 'debug':
        console.debug(formattedMessage)
        break
    }

    // TODO: Kirim log ke service monitoring jika diperlukan
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  // Log untuk API calls
  apiCall(method: string, url: string, status?: number, duration?: number) {
    const message = `API ${method} ${url}`
    const data = status ? { status, duration } : { duration }

    if (status && status >= 400) {
      this.error(message, data)
    } else {
      this.info(message, data)
    }
  }

  // Log untuk user actions
  userAction(action: string, details?: any) {
    this.info(`User Action: ${action}`, details)
  }

  // Log untuk socket events
  socketEvent(event: string, data?: any) {
    this.debug(`Socket Event: ${event}`, data)
  }
}

export const logger = new Logger()