/**
 * @fileoverview Analytics API routes.
 *
 * GET /api/analytics/summary
 * GET /api/analytics/daily
 * GET /api/analytics/weekly
 * GET /api/analytics/monthly
 * GET /api/analytics/cameras
 * GET /api/analytics/confidence
 * GET /api/analytics/trends
 */

import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/summary',    asyncHandler(analyticsController.getSummary));
router.get('/daily',      asyncHandler(analyticsController.getDaily));
router.get('/weekly',     asyncHandler(analyticsController.getWeekly));
router.get('/monthly',    asyncHandler(analyticsController.getMonthly));
router.get('/cameras',    asyncHandler(analyticsController.getCameras));
router.get('/confidence', asyncHandler(analyticsController.getConfidence));
router.get('/trends',     asyncHandler(analyticsController.getTrends));

export default router;
