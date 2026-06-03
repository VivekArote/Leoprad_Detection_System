/**
 * @fileoverview Health-check routes.
 *
 * GET /health
 * GET /health/database
 * GET /health/cloudinary
 * GET /health/telegram
 * GET /health/model
 */

import { Router } from 'express';
import * as healthController from '../controllers/health.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/',           asyncHandler(healthController.getHealth));
router.get('/database',   asyncHandler(healthController.getHealthDatabase));
router.get('/cloudinary', asyncHandler(healthController.getHealthCloudinary));
router.get('/telegram',   asyncHandler(healthController.getHealthTelegram));
router.get('/model',      asyncHandler(healthController.getHealthModel));

export default router;
