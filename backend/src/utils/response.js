/**
 * @fileoverview Standardised API response helpers.
 * All responses follow the shape: { success, data?, message?, meta? }
 */

/**
 * Sends a success response.
 *
 * @param {import('express').Response} res
 * @param {*} data - Response payload
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 * @param {object} [meta] - Optional pagination/meta data
 */
export function sendSuccess(res, data, message = 'Success', statusCode = 200, meta = null) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
}

/**
 * Sends an error response.
 *
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode=500]
 * @param {object} [errors] - Optional field-level validation errors
 */
export function sendError(res, message, statusCode = 500, errors = null) {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
}
