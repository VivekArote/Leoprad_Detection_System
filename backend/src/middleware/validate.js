/**
 * @fileoverview Middleware that processes express-validator results and returns
 * a standardised 422 error if any validation rule failed.
 */

import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';

/**
 * Reads express-validator errors and short-circuits with a 422 response if
 * there are any validation failures.
 *
 * @type {import('express').RequestHandler}
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formatted = errors.array().map((e) => ({
            field: e.path || e.param,
            message: e.msg,
        }));
        return sendError(res, 'Validation failed', 422, formatted);
    }
    next();
};

export default validate;
