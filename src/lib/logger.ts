type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function log(level: LogLevel, message: string, ...args: any[]) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLogLevel]) return

  const timestamp = new Date().toISOString()
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`

  switch (level) {
    case 'debug':
      console.debug(formattedMessage, ...args)
      break
    case 'info':
      console.info(formattedMessage, ...args)
      break
    case 'warn':
      console.warn(formattedMessage, ...args)
      break
    case 'error':
      console.error(formattedMessage, ...args)
      break
  }
}

export const logger = {
  debug: (message: string, ...args: any[]) => log('debug', message, ...args),
  info: (message: string, ...args: any[]) => log('info', message, ...args),
  warn: (message: string, ...args: any[]) => log('warn', message, ...args),
  error: (message: string, ...args: any[]) => log('error', message, ...args),
}
