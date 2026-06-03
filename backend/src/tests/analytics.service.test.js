/**
 * @fileoverview Unit tests for analytics.service.js
 * Mocks the detection repository to test aggregation result mapping.
 */

import { jest } from '@jest/globals';

// ── Mock the repository before importing the service ──────────────────────────
const mockAggregate = jest.fn();

jest.unstable_mockModule('../repositories/detection.repository.js', () => ({
    aggregate: mockAggregate,
    countDetections: jest.fn(),
    createDetection: jest.fn(),
    findDetections: jest.fn(),
    findDetectionById: jest.fn(),
    deleteDetectionById: jest.fn(),
    updateDetection: jest.fn(),
    default: {},
}));

const { getSummaryAnalytics, getCameraAnalytics, getConfidenceAnalytics, getDailyTrends } =
    await import('../services/analytics.service.js');

describe('Analytics Service', () => {
    beforeEach(() => jest.clearAllMocks());

    // ── getSummaryAnalytics ────────────────────────────────────────────────────
    describe('getSummaryAnalytics()', () => {
        it('returns zeros when no detections exist', async () => {
            mockAggregate
                .mockResolvedValueOnce([{ total: [], today: [], weekly: [], monthly: [] }]) // facet
                .mockResolvedValueOnce([])   // avg+peak
                .mockResolvedValueOnce([])   // most active camera
                .mockResolvedValueOnce([]);  // last detection

            const result = await getSummaryAnalytics();

            expect(result.total).toBe(0);
            expect(result.today).toBe(0);
            expect(result.averageConfidence).toBe(0);
            expect(result.mostActiveCamera).toBeNull();
            expect(result.lastDetection).toBeNull();
        });

        it('maps aggregation results correctly', async () => {
            mockAggregate
                .mockResolvedValueOnce([{
                    total:   [{ count: 42 }],
                    today:   [{ count: 5  }],
                    weekly:  [{ count: 20 }],
                    monthly: [{ count: 35 }],
                }])
                .mockResolvedValueOnce([{ averageConfidence: 0.856789, highestConfidence: 0.97 }])
                .mockResolvedValueOnce([{ _id: 'camera-01', count: 30 }])
                .mockResolvedValueOnce([{ timestamp: new Date('2026-06-01T10:00:00Z') }]);

            const result = await getSummaryAnalytics();

            expect(result.total).toBe(42);
            expect(result.today).toBe(5);
            expect(result.weekly).toBe(20);
            expect(result.monthly).toBe(35);
            expect(result.averageConfidence).toBe(0.8568);
            expect(result.highestConfidence).toBe(0.97);
            expect(result.mostActiveCamera).toBe('camera-01');
            expect(result.lastDetection).toBeInstanceOf(Date);
        });
    });

    // ── getCameraAnalytics ────────────────────────────────────────────────────
    describe('getCameraAnalytics()', () => {
        it('returns empty array when no cameras', async () => {
            mockAggregate.mockResolvedValueOnce([]);
            const result = await getCameraAnalytics();
            expect(result).toEqual([]);
        });

        it('returns per-camera statistics', async () => {
            mockAggregate.mockResolvedValueOnce([
                { cameraId: 'camera-01', count: 15, averageConfidence: 0.85, lastDetection: new Date() },
            ]);
            const result = await getCameraAnalytics();
            expect(result).toHaveLength(1);
            expect(result[0].cameraId).toBe('camera-01');
            expect(result[0].count).toBe(15);
        });
    });

    // ── getConfidenceAnalytics ────────────────────────────────────────────────
    describe('getConfidenceAnalytics()', () => {
        it('returns zero stats when collection is empty', async () => {
            mockAggregate
                .mockResolvedValueOnce([])  // stats
                .mockResolvedValueOnce([]); // distribution

            const result = await getConfidenceAnalytics();

            expect(result.min).toBe(0);
            expect(result.max).toBe(0);
            expect(result.average).toBe(0);
            expect(result.distribution).toEqual([]);
        });

        it('returns stats and mapped distribution', async () => {
            mockAggregate
                .mockResolvedValueOnce([{ min: 0.81, max: 0.97, avg: 0.89 }])
                .mockResolvedValueOnce([
                    { _id: 0.8, count: 10 },
                    { _id: 0.9, count: 5  },
                ]);

            const result = await getConfidenceAnalytics();

            expect(result.min).toBe(0.81);
            expect(result.max).toBe(0.97);
            expect(result.average).toBe(0.89);
            expect(result.distribution).toHaveLength(2);
            expect(result.distribution[0].count).toBe(10);
        });
    });

    // ── getDailyTrends ────────────────────────────────────────────────────────
    describe('getDailyTrends()', () => {
        it('returns daily trend data', async () => {
            mockAggregate.mockResolvedValueOnce([
                { date: '2026-06-01', count: 3 },
                { date: '2026-06-02', count: 7 },
            ]);

            const result = await getDailyTrends(30);

            expect(result).toHaveLength(2);
            expect(result[0].date).toBe('2026-06-01');
            expect(result[1].count).toBe(7);
        });
    });
});
