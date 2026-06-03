/**
 * @fileoverview Centralised Express error-handling middleware.
 * Must be registered LAST in the middleware chain (after all routes).
 */

import logger from '../utils/logger.js';
import { sendError } from '../utils/response.js';

/**
 * Express error-handling middleware (4 params required).
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    logger.error('❌ Unhandled error', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return sendError(res, 'Database validation failed', 422, errors);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return sendError(res, `Duplicate value for ${field}`, 409);
    }

    // JSON parse error
    if (err.type === 'entity.parse.failed') {
        return sendError(res, 'Invalid JSON in request body', 400);
    }

    // Request too large
    if (err.type === 'entity.too.large') {
        return sendError(res, 'Request payload too large', 413);
    }

    const statusCode = err.statusCode || err.status || 500;
    const message =
        process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'Internal server error'
            : err.message || 'Internal server error';

    return sendError(res, message, statusCode);
};

export default errorHandler;
