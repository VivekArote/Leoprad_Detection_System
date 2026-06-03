/**
 * @fileoverview Request validators for detection endpoints using express-validator.
 */

import { body, query, param } from 'express-validator';

/** Validates the POST /api/detections payload sent by the Python pipeline. */
export const validateCreateDetection = [
    body('label')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('label is required and must be a non-empty string'),

    body('confidence')
        .isFloat({ min: 0, max: 1 })
        .withMessage('confidence must be a number between 0 and 1'),

    body('timestamp')
        .optional()
        .isString()
        .withMessage('timestamp must be a string'),

    body('image_path')
        .optional()
        .isString()
        .withMessage('image_path must be a string'),

    body('camera_id')
        .optional()
        .isString()
        .trim()
        .withMessage('camera_id must be a string'),

    body('bounding_box.x').optional().isNumeric().withMessage('bounding_box.x must be a number'),
    body('bounding_box.y').optional().isNumeric().withMessage('bounding_box.y must be a number'),
    body('bounding_box.width').optional().isNumeric().withMessage('bounding_box.width must be a number'),
    body('bounding_box.height').optional().isNumeric().withMessage('bounding_box.height must be a number'),
];

/** Validates query parameters for GET /api/detections */
export const validateListDetections = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit must be between 1 and 100'),

    query('sortBy')
        .optional()
        .isIn(['timestamp', 'confidenceScore', 'cameraId', 'createdAt'])
        .withMessage('sortBy must be one of: timestamp, confidenceScore, cameraId, createdAt'),

    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortOrder must be asc or desc'),

    query('cameraId')
        .optional()
        .isString()
        .trim()
        .withMessage('cameraId must be a string'),

    query('minConfidence')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('minConfidence must be between 0 and 1'),

    query('maxConfidence')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('maxConfidence must be between 0 and 1'),

    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('startDate must be a valid ISO 8601 date'),

    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('endDate must be a valid ISO 8601 date'),
];

/** Validates the :id route parameter (UUID) */
export const validateDetectionId = [
    param('id')
        .isUUID()
        .withMessage('id must be a valid UUID'),
];
