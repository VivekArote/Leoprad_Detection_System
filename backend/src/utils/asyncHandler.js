/**
 * @fileoverview Utility wrapper that catches async errors and forwards them
 * to Express's next() middleware, avoiding repetitive try/catch blocks.
 */

/**
 * Wraps an async Express route handler to forward errors to next().
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise<void>
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
