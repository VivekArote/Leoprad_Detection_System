/**
 * @fileoverview Analytics controller — thin HTTP layer that delegates to the analytics service.
 */

import * as analyticsService from '../services/analytics.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/analytics/summary
 * @type {import('express').RequestHandler}
 */
export async function getSummary(req, res) {
    const data = await analyticsService.getSummaryAnalytics();
    return sendSuccess(res, data, 'Summary analytics retrieved');
}

/**
 * GET /api/analytics/daily
 * @type {import('express').RequestHandler}
 */
export async function getDaily(req, res) {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getDailyTrends(days);
    return sendSuccess(res, data, 'Daily trends retrieved');
}

/**
 * GET /api/analytics/weekly
 * @type {import('express').RequestHandler}
 */
export async function getWeekly(req, res) {
    const weeks = parseInt(req.query.weeks) || 12;
    const data = await analyticsService.getWeeklyTrends(weeks);
    return sendSuccess(res, data, 'Weekly trends retrieved');
}

/**
 * GET /api/analytics/monthly
 * @type {import('express').RequestHandler}
 */
export async function getMonthly(req, res) {
    const months = parseInt(req.query.months) || 12;
    const data = await analyticsService.getMonthlyTrends(months);
    return sendSuccess(res, data, 'Monthly trends retrieved');
}

/**
 * GET /api/analytics/cameras
 * @type {import('express').RequestHandler}
 */
export async function getCameras(req, res) {
    const data = await analyticsService.getCameraAnalytics();
    return sendSuccess(res, data, 'Camera analytics retrieved');
}

/**
 * GET /api/analytics/confidence
 * @type {import('express').RequestHandler}
 */
export async function getConfidence(req, res) {
    const data = await analyticsService.getConfidenceAnalytics();
    return sendSuccess(res, data, 'Confidence analytics retrieved');
}

/**
 * GET /api/analytics/trends
 * Returns hourly trend data (last 24 h by default).
 * @type {import('express').RequestHandler}
 */
export async function getTrends(req, res) {
    const hours = parseInt(req.query.hours) || 24;
    const data = await analyticsService.getHourlyTrends(hours);
    return sendSuccess(res, data, 'Trend analytics retrieved');
}
