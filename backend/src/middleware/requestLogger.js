/**
 * @fileoverview HTTP request logging middleware using Morgan + Winston.
 */

import morgan from 'morgan';
import logger from '../utils/logger.js';

/** Morgan stream that writes to Winston */
const stream = {
    write: (message) => logger.info(message.trim()),
};

/**
 * Morgan middleware configured to log in "combined" format in production
 * and "dev" format otherwise.
 */
const requestLogger = morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    { stream }
);

export default requestLogger;
