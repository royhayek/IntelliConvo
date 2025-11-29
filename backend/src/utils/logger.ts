import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    // Extract metadata (everything except level, message, timestamp)
    const { level, message, timestamp, ...meta } = info;

    // Format the base message
    let output = `${timestamp} ${level}: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      try {
        // Handle BigInt and circular references in metadata
        const metaStr = JSON.stringify(meta, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        );
        if (metaStr !== '{}') {
          output += ` ${metaStr}`;
        }
      } catch {
        // If stringify fails, skip metadata
      }
    }

    return output;
  }),
);

const isDevelopment = process.env.NODE_ENV !== 'production';

const transports: winston.transport[] = [
  new winston.transports.Console(),
];

// Only add file transports in development
if (isDevelopment) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: 'logs/all.log' })
  );
}

export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});