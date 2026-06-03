/**
 * @fileoverview Detection API routes.
 *
 * POST   /api/detections      - Create (from Python pipeline)
 * GET    /api/detections      - List with pagination & filters
 * GET    /api/detections/:id  - Get single detection
 * DELETE /api/detections/:id  - Delete detection + Cloudinary image
 */

import { Router } from 'express';
import * as detectionController from '../controllers/detection.controller.js';
import {
    validateCreateDetection,
    validateListDetections,
    validateDetectionId,
} from '../validators/detection.validator.js';
import validate from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.post(
    '/',
    validateCreateDetection,
    validate,
    asyncHandler(detectionController.createDetection)
);

router.get(
    '/',
    validateListDetections,
    validate,
    asyncHandler(detectionController.getDetections)
);

router.get(
    '/:id',
    validateDetectionId,
    validate,
    asyncHandler(detectionController.getDetectionById)
);

router.delete(
    '/:id',
    validateDetectionId,
    validate,
    asyncHandler(detectionController.deleteDetection)
);

export default router;
