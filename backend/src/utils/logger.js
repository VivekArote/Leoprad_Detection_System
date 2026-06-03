/**
 * @fileoverview Winston logger configuration.
 * Outputs to console and rotating daily log files.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.resolve(__dirname, '../../logs');

/** Custom log format */
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        if (Object.keys(meta).length) {
            log += ` ${JSON.stringify(meta)}`;
        }
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

/** Rotating transport for all logs */
const allLogsTransport = new DailyRotateFile({
    filename: path.join(LOGS_DIR, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
});

/** Rotating transport for error logs only */
const errorLogsTransport = new DailyRotateFile({
    filename: path.join(LOGS_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
});

/** Rotating transport for detection events */
const detectionLogsTransport = new DailyRotateFile({
    filename: path.join(LOGS_DIR, 'detections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'info',
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            ),
        }),
        allLogsTransport,
        errorLogsTransport,
    ],
});

/** Child logger scoped to detection events */
export const detectionLogger = logger.child({ service: 'detection' });
detectionLogger.add(detectionLogsTransport);

export default logger;
