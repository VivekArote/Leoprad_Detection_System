/**
 * @fileoverview Analytics service — all aggregation logic for detection statistics.
 * Uses MongoDB aggregation pipelines via the detection repository.
 */

import * as detectionRepo from '../repositories/detection.repository.js';

// ── Helper: date range boundaries ────────────────────────────────────────────

/** @returns {Date} Start of today (midnight UTC) */
function startOfToday() {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

/** @returns {Date} Start of current week (Monday midnight UTC) */
function startOfWeek() {
    const d = startOfToday();
    const day = d.getUTCDay(); // 0=Sun … 6=Sat
    const diff = day === 0 ? -6 : 1 - day; // shift to Monday
    d.setUTCDate(d.getUTCDate() + diff);
    return d;
}

/** @returns {Date} Start of current month (1st midnight UTC) */
function startOfMonth() {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

// ── Summary Analytics ─────────────────────────────────────────────────────────

/**
 * Returns high-level summary statistics.
 *
 * @returns {Promise<{
 *   total: number,
 *   today: number,
 *   weekly: number,
 *   monthly: number,
 *   averageConfidence: number,
 *   highestConfidence: object|null,
 *   mostActiveCamera: string|null,
 *   lastDetection: Date|null
 * }>}
 */
export async function getSummaryAnalytics() {
    const [counts, avgAndPeak, mostActiveCamera, lastDetection] = await Promise.all([
        // total / today / weekly / monthly counts in one aggregation
        detectionRepo.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    today: [
                        { $match: { timestamp: { $gte: startOfToday() } } },
                        { $count: 'count' },
                    ],
                    weekly: [
                        { $match: { timestamp: { $gte: startOfWeek() } } },
                        { $count: 'count' },
                    ],
                    monthly: [
                        { $match: { timestamp: { $gte: startOfMonth() } } },
                        { $count: 'count' },
                    ],
                },
            },
        ]),

        // average confidence + single highest-confidence detection
        detectionRepo.aggregate([
            {
                $group: {
                    _id: null,
                    averageConfidence: { $avg: '$confidenceScore' },
                    highestConfidence: { $max: '$confidenceScore' },
                },
            },
        ]),

        // most active camera
        detectionRepo.aggregate([
            { $group: { _id: '$cameraId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
        ]),

        // last detection timestamp
        detectionRepo.aggregate([
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
            { $project: { timestamp: 1, _id: 0 } },
        ]),
    ]);

    const facets = counts[0] || {};

    return {
        total: facets.total?.[0]?.count ?? 0,
        today: facets.today?.[0]?.count ?? 0,
        weekly: facets.weekly?.[0]?.count ?? 0,
        monthly: facets.monthly?.[0]?.count ?? 0,
        averageConfidence: avgAndPeak[0]
            ? parseFloat(avgAndPeak[0].averageConfidence.toFixed(4))
            : 0,
        highestConfidence: avgAndPeak[0]?.highestConfidence ?? null,
        mostActiveCamera: mostActiveCamera[0]?._id ?? null,
        lastDetection: lastDetection[0]?.timestamp ?? null,
    };
}

// ── Trend Analytics ───────────────────────────────────────────────────────────

/**
 * Returns detection counts grouped by hour for the last N hours.
 *
 * @param {number} [hours=24]
 * @returns {Promise<Array<{ hour: string, count: number }>>}
 */
export async function getHourlyTrends(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return detectionRepo.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
            $group: {
                _id: {
                    year: { $year: '$timestamp' },
                    month: { $month: '$timestamp' },
                    day: { $dayOfMonth: '$timestamp' },
                    hour: { $hour: '$timestamp' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
        {
            $project: {
                _id: 0,
                hour: {
                    $dateToString: {
                        format: '%Y-%m-%dT%H:00:00Z',
                        date: {
                            $dateFromParts: {
                                year: '$_id.year',
                                month: '$_id.month',
                                day: '$_id.day',
                                hour: '$_id.hour',
                            },
                        },
                    },
                },
                count: 1,
            },
        },
    ]);
}

/**
 * Returns detection counts grouped by calendar day for the last N days.
 *
 * @param {number} [days=30]
 * @returns {Promise<Array<{ date: string, count: number }>>}
 */
export async function getDailyTrends(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return detectionRepo.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
            $group: {
                _id: {
                    year: { $year: '$timestamp' },
                    month: { $month: '$timestamp' },
                    day: { $dayOfMonth: '$timestamp' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        {
            $project: {
                _id: 0,
                date: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: {
                            $dateFromParts: {
                                year: '$_id.year',
                                month: '$_id.month',
                                day: '$_id.day',
                            },
                        },
                    },
                },
                count: 1,
            },
        },
    ]);
}

/**
 * Returns detection counts grouped by week for the last N weeks.
 *
 * @param {number} [weeks=12]
 * @returns {Promise<Array<{ week: string, count: number }>>}
 */
export async function getWeeklyTrends(weeks = 12) {
    const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

    return detectionRepo.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
            $group: {
                _id: {
                    year: { $isoWeekYear: '$timestamp' },
                    week: { $isoWeek: '$timestamp' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
        {
            $project: {
                _id: 0,
                week: {
                    $concat: [
                        { $toString: '$_id.year' },
                        '-W',
                        {
                            $cond: [
                                { $lt: ['$_id.week', 10] },
                                { $concat: ['0', { $toString: '$_id.week' }] },
                                { $toString: '$_id.week' },
                            ],
                        },
                    ],
                },
                count: 1,
            },
        },
    ]);
}

/**
 * Returns detection counts grouped by month for the last N months.
 *
 * @param {number} [months=12]
 * @returns {Promise<Array<{ month: string, count: number }>>}
 */
export async function getMonthlyTrends(months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);
    since.setUTCHours(0, 0, 0, 0);

    return detectionRepo.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
            $group: {
                _id: {
                    year: { $year: '$timestamp' },
                    month: { $month: '$timestamp' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
            $project: {
                _id: 0,
                month: {
                    $concat: [
                        { $toString: '$_id.year' },
                        '-',
                        {
                            $cond: [
                                { $lt: ['$_id.month', 10] },
                                { $concat: ['0', { $toString: '$_id.month' }] },
                                { $toString: '$_id.month' },
                            ],
                        },
                    ],
                },
                count: 1,
            },
        },
    ]);
}

// ── Camera Analytics ──────────────────────────────────────────────────────────

/**
 * Returns per-camera statistics.
 *
 * @returns {Promise<Array<{
 *   cameraId: string,
 *   count: number,
 *   averageConfidence: number,
 *   lastDetection: Date|null
 * }>>}
 */
export async function getCameraAnalytics() {
    return detectionRepo.aggregate([
        {
            $group: {
                _id: '$cameraId',
                count: { $sum: 1 },
                averageConfidence: { $avg: '$confidenceScore' },
                lastDetection: { $max: '$timestamp' },
            },
        },
        { $sort: { count: -1 } },
        {
            $project: {
                _id: 0,
                cameraId: '$_id',
                count: 1,
                averageConfidence: { $round: ['$averageConfidence', 4] },
                lastDetection: 1,
            },
        },
    ]);
}

// ── Confidence Analytics ──────────────────────────────────────────────────────

const CONFIDENCE_BUCKETS = [
    { label: '0.50-0.60', min: 0.50, max: 0.60 },
    { label: '0.60-0.70', min: 0.60, max: 0.70 },
    { label: '0.70-0.80', min: 0.70, max: 0.80 },
    { label: '0.80-0.90', min: 0.80, max: 0.90 },
    { label: '0.90-1.00', min: 0.90, max: 1.01 },
];

/**
 * Returns confidence statistics including a distribution histogram.
 *
 * @returns {Promise<{
 *   min: number,
 *   max: number,
 *   average: number,
 *   distribution: Array<{ range: string, count: number }>
 * }>}
 */
export async function getConfidenceAnalytics() {
    const [statsResult, distributionResult] = await Promise.all([
        detectionRepo.aggregate([
            {
                $group: {
                    _id: null,
                    min: { $min: '$confidenceScore' },
                    max: { $max: '$confidenceScore' },
                    avg: { $avg: '$confidenceScore' },
                },
            },
        ]),

        detectionRepo.aggregate([
            {
                $bucket: {
                    groupBy: '$confidenceScore',
                    boundaries: [0.5, 0.6, 0.7, 0.8, 0.9, 1.01],
                    default: 'other',
                    output: { count: { $sum: 1 } },
                },
            },
        ]),
    ]);

    const stats = statsResult[0] || { min: 0, max: 0, avg: 0 };

    // Map bucket boundaries back to readable labels
    const distribution = distributionResult.map((bucket, idx) => ({
        range: CONFIDENCE_BUCKETS[idx]?.label || String(bucket._id),
        count: bucket.count,
    }));

    return {
        min: parseFloat((stats.min || 0).toFixed(4)),
        max: parseFloat((stats.max || 0).toFixed(4)),
        average: parseFloat((stats.avg || 0).toFixed(4)),
        distribution,
    };
}

export default {
    getSummaryAnalytics,
    getHourlyTrends,
    getDailyTrends,
    getWeeklyTrends,
    getMonthlyTrends,
    getCameraAnalytics,
    getConfidenceAnalytics,
};
