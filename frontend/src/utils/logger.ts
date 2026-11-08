type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) ||
  (import.meta.env.DEV ? 'debug' : 'info');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatPrefix(level: LogLevel, module?: string): string {
  const time = new Date().toISOString().substring(11, 23);
  const tag = module ? `[${module}]` : '';
  return `[${time}] [${level.toUpperCase()}]${tag}`;
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(formatPrefix('debug'), message, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) {
      console.info(formatPrefix('info'), message, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(formatPrefix('warn'), message, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (shouldLog('error')) {
      console.error(formatPrefix('error'), message, ...args);
    }
  },

  withModule: (module: string) => ({
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.debug(formatPrefix('debug', module), message, ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        console.info(formatPrefix('info', module), message, ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(formatPrefix('warn', module), message, ...args);
      }
    },
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(formatPrefix('error', module), message, ...args);
      }
    },
  }),
};
