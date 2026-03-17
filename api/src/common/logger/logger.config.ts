import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf((info) => {
    const { timestamp, level, message, context, stack } = info;
    const ctx = typeof context === 'string' ? context : 'Application';
    let log = `${String(timestamp)} [${ctx}] ${String(level).toUpperCase()}: ${String(message)}`;
    if (stack) {
      const stackStr =
        typeof stack === 'string' ? stack : JSON.stringify(stack);
      log += `\nStack trace:\n${stackStr}`;
    }
    return log;
  }),
);

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize(),
        winston.format.printf((info) => {
          const { timestamp, level, message, context, ms } = info;
          const ctx = typeof context === 'string' ? context : 'Application';
          const msStr = typeof ms === 'string' ? ms : '';
          return `${String(timestamp)} [${ctx}] ${String(level)}: ${String(message)} ${msStr}`;
        }),
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: fileFormat,
    }),
  ],
};

export const logger = WinstonModule.createLogger(winstonConfig);
