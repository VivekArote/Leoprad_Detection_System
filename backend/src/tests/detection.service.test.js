/**
 * @fileoverview Unit tests for detection.service.js
 */

import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockUploadDetectionImage = jest.fn();
const mockDeleteLocalFile      = jest.fn();
const mockDeleteCloudinaryImage = jest.fn();

jest.unstable_mockModule('../services/cloudinary.service.js', () => ({
    uploadDetectionImage: mockUploadDetectionImage,
    deleteLocalFile: mockDeleteLocalFile,
    deleteCloudinaryImage: mockDeleteCloudinaryImage,
    CLOUDINARY_FOLDERS: { DEFAULT: 'leopard-detections/camera-01' },
    default: {},
}));

const mockCreateDetection   = jest.fn();
const mockFindDetections    = jest.fn();
const mockFindDetectionById = jest.fn();
const mockDeleteDetectionById = jest.fn();
const mockUpdateDetection   = jest.fn();

jest.unstable_mockModule('../repositories/detection.repository.js', () => ({
    createDetection: mockCreateDetection,
    findDetections: mockFindDetections,
    findDetectionById: mockFindDetectionById,
    deleteDetectionById: mockDeleteDetectionById,
    updateDetection: mockUpdateDetection,
    aggregate: jest.fn(),
    countDetections: jest.fn(),
    default: {},
}));

// Mock fs.existsSync — return true for image paths so upload path is tested
jest.unstable_mockModule('fs', () => ({
    existsSync: (p) => p !== null && p !== undefined && p !== '',
    unlinkSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
}));

const {
    processDetection,
    markAlertSent,
    listDetections,
    getDetectionById,
    removeDetection,
} = await import('../services/detection.service.js');

describe('Detection Service', () => {
    beforeEach(() => jest.clearAllMocks());

    // ── processDetection ──────────────────────────────────────────────────────
    describe('processDetection()', () => {
        const basePayload = {
            label: 'leopard_head',
            confidence: 0.92,
            timestamp: '2026-06-03 10:00:00',
            image_path: 'detections/alert_123.jpg',
            camera_id: 'camera-01',
        };

        it('uploads image and saves to MongoDB', async () => {
            mockUploadDetectionImage.mockResolvedValueOnce({
                url: 'https://res.cloudinary.com/test/image.jpg',
                publicId: 'leopard-detections/camera-01/test-id',
            });
            mockCreateDetection.mockResolvedValueOnce({ detectionId: 'uuid-1', ...basePayload });

            const result = await processDetection(basePayload);

            expect(mockUploadDetectionImage).toHaveBeenCalledTimes(1);
            expect(mockCreateDetection).toHaveBeenCalledTimes(1);
            expect(result.imageUrl).toBe('https://res.cloudinary.com/test/image.jpg');
            expect(result.detectionId).toBeDefined();
        });

        it('continues without Cloudinary URL if upload fails', async () => {
            mockUploadDetectionImage.mockRejectedValueOnce(new Error('Upload failed'));
            mockCreateDetection.mockResolvedValueOnce({ detectionId: 'uuid-2' });

            const result = await processDetection(basePayload);

            expect(result.imageUrl).toBeNull();
            expect(mockCreateDetection).toHaveBeenCalledTimes(1);
        });

        it('persists correct detection class', async () => {
            mockUploadDetectionImage.mockResolvedValueOnce({ url: 'https://cdn.test/img.jpg', publicId: 'pid' });
            mockCreateDetection.mockResolvedValueOnce({ detectionId: 'uuid-3' });

            await processDetection({ ...basePayload, label: 'leopard_body' });

            const savedData = mockCreateDetection.mock.calls[0][0];
            expect(savedData.detectionClass).toBe('leopard_body');
            expect(savedData.confidenceScore).toBe(0.92);
            expect(savedData.cameraId).toBe('camera-01');
        });

        it('defaults cameraId to camera-01 when not provided', async () => {
            mockUploadDetectionImage.mockResolvedValueOnce({ url: 'https://cdn.test/img.jpg', publicId: 'pid' });
            mockCreateDetection.mockResolvedValueOnce({ detectionId: 'uuid-4' });

            await processDetection({ label: 'leopard_head', confidence: 0.85, timestamp: '2026-06-03 11:00:00', image_path: 'test.jpg' });

            const savedData = mockCreateDetection.mock.calls[0][0];
            expect(savedData.cameraId).toBe('camera-01');
        });
    });

    // ── markAlertSent ─────────────────────────────────────────────────────────
    describe('markAlertSent()', () => {
        it('calls updateDetection with alertSent: true', async () => {
            mockUpdateDetection.mockResolvedValueOnce({});
            await markAlertSent('uuid-1', true);
            expect(mockUpdateDetection).toHaveBeenCalledWith('uuid-1', { alertSent: true });
        });
    });

    // ── getDetectionById ──────────────────────────────────────────────────────
    describe('getDetectionById()', () => {
        it('returns detection when found', async () => {
            mockFindDetectionById.mockResolvedValueOnce({ detectionId: 'uuid-1' });
            const result = await getDetectionById('uuid-1');
            expect(result.detectionId).toBe('uuid-1');
        });

        it('returns null when not found', async () => {
            mockFindDetectionById.mockResolvedValueOnce(null);
            const result = await getDetectionById('nonexistent');
            expect(result).toBeNull();
        });
    });

    // ── removeDetection ───────────────────────────────────────────────────────
    describe('removeDetection()', () => {
        it('returns false if detection not found', async () => {
            mockFindDetectionById.mockResolvedValueOnce(null);
            const result = await removeDetection('nonexistent');
            expect(result).toBe(false);
            expect(mockDeleteDetectionById).not.toHaveBeenCalled();
        });

        it('deletes Cloudinary image and MongoDB record', async () => {
            mockFindDetectionById.mockResolvedValueOnce({
                detectionId: 'uuid-1',
                cloudinaryPublicId: 'leopard-detections/camera-01/uuid-1',
            });
            mockDeleteCloudinaryImage.mockResolvedValueOnce(true);
            mockDeleteDetectionById.mockResolvedValueOnce(true);

            const result = await removeDetection('uuid-1');

            expect(mockDeleteCloudinaryImage).toHaveBeenCalledWith('leopard-detections/camera-01/uuid-1');
            expect(mockDeleteDetectionById).toHaveBeenCalledWith('uuid-1');
            expect(result).toBe(true);
        });
    });

    // ── listDetections ────────────────────────────────────────────────────────
    describe('listDetections()', () => {
        it('passes filters and pagination to repository', async () => {
            mockFindDetections.mockResolvedValueOnce({ data: [], total: 0, page: 1, totalPages: 0 });

            await listDetections({
                page: 2,
                limit: 10,
                cameraId: 'camera-01',
                minConfidence: '0.8',
                sortBy: 'confidenceScore',
                sortOrder: 'asc',
            });

            const [filters, options] = mockFindDetections.mock.calls[0];
            expect(filters.cameraId).toBe('camera-01');
            expect(filters.confidenceScore.$gte).toBe(0.8);
            expect(options.page).toBe(2);
            expect(options.limit).toBe(10);
            expect(options.sortBy).toBe('confidenceScore');
        });

        it('caps limit at 100', async () => {
            mockFindDetections.mockResolvedValueOnce({ data: [], total: 0, page: 1, totalPages: 0 });
            await listDetections({ limit: '9999' });
            const [, options] = mockFindDetections.mock.calls[0];
            expect(options.limit).toBe(100);
        });
    });
});
