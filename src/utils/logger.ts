import { config } from '@/config/environment';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const levelMap: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

const currentLevel = levelMap[config.logLevel] || LogLevel.INFO;

const formatMessage = (level: string, message: string, data?: unknown): string => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}]${dataStr} ${message}`;
};

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (currentLevel <= LogLevel.DEBUG) {
      console.log(`${colors.blue}${formatMessage('DEBUG', message, data)}${colors.reset}`);
    }
  },

  info: (message: string, data?: unknown) => {
    if (currentLevel <= LogLevel.INFO) {
      console.log(`${colors.green}${formatMessage('INFO', message, data)}${colors.reset}`);
    }
  },

  warn: (message: string, data?: unknown) => {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(`${colors.yellow}${formatMessage('WARN', message, data)}${colors.reset}`);
    }
  },

  error: (message: string, error?: unknown) => {
    if (currentLevel <= LogLevel.ERROR) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`${colors.red}${formatMessage('ERROR', message, errorMessage)}${colors.reset}`);
    }
  },
};
