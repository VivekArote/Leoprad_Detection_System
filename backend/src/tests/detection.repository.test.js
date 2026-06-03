/**
 * @fileoverview Repository layer tests for detection.repository.js
 * Mocks the Mongoose model to test query construction.
 */

import { jest } from '@jest/globals';

// ── Mock Mongoose Detection model ─────────────────────────────────────────────
const mockSave       = jest.fn();
const mockFind       = jest.fn();
const mockFindOne    = jest.fn();
const mockDeleteOne  = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockCountDocuments   = jest.fn();
const mockAggregate        = jest.fn();

// Chainable query builder mock
const chainable = {
    sort:  function() { return this; },
    skip:  function() { return this; },
    limit: function() { return this; },
    lean:  function() { return Promise.resolve([]); },
};

jest.unstable_mockModule('../models/detection.model.js', () => {
    function MockDetection(data) {
        Object.assign(this, data);
        this.save = mockSave;
    }
    MockDetection.find = mockFind;
    MockDetection.findOne = mockFindOne;
    MockDetection.deleteOne = mockDeleteOne;
    MockDetection.findOneAndUpdate = mockFindOneAndUpdate;
    MockDetection.countDocuments = mockCountDocuments;
    MockDetection.aggregate = mockAggregate;
    return { default: MockDetection };
});

const {
    createDetection,
    findDetectionById,
    deleteDetectionById,
    countDetections,
} = await import('../repositories/detection.repository.js');

describe('Detection Repository', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('createDetection()', () => {
        it('calls save() on a new Detection document', async () => {
            mockSave.mockResolvedValueOnce({ detectionId: 'uuid-1', detectionClass: 'leopard_head' });

            const result = await createDetection({
                detectionId: 'uuid-1',
                detectionClass: 'leopard_head',
                confidenceScore: 0.9,
                timestamp: new Date(),
                cameraId: 'camera-01',
            });

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(result.detectionId).toBe('uuid-1');
        });
    });

    describe('findDetectionById()', () => {
        it('queries by detectionId and returns lean result', async () => {
            mockFindOne.mockReturnValue({ lean: () => Promise.resolve({ detectionId: 'uuid-1' }) });

            const result = await findDetectionById('uuid-1');

            expect(mockFindOne).toHaveBeenCalledWith({ detectionId: 'uuid-1' });
            expect(result.detectionId).toBe('uuid-1');
        });

        it('returns null when not found', async () => {
            mockFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
            const result = await findDetectionById('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('deleteDetectionById()', () => {
        it('returns true when deletedCount is 1', async () => {
            mockDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });
            const result = await deleteDetectionById('uuid-1');
            expect(result).toBe(true);
        });

        it('returns false when nothing was deleted', async () => {
            mockDeleteOne.mockResolvedValueOnce({ deletedCount: 0 });
            const result = await deleteDetectionById('nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('countDetections()', () => {
        it('passes filter to countDocuments', async () => {
            mockCountDocuments.mockResolvedValueOnce(7);
            const count = await countDetections({ cameraId: 'camera-01' });
            expect(mockCountDocuments).toHaveBeenCalledWith({ cameraId: 'camera-01' });
            expect(count).toBe(7);
        });
    });
});
