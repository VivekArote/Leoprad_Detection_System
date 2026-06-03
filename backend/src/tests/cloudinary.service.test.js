/**
 * @fileoverview Unit tests for cloudinary.service.js
 */

import { jest } from '@jest/globals';

// ── Mock cloudinary SDK ───────────────────────────────────────────────────────
const mockUpload  = jest.fn();
const mockDestroy = jest.fn();

jest.unstable_mockModule('../config/cloudinary.js', () => ({
    cloudinary: {
        uploader: { upload: mockUpload, destroy: mockDestroy },
        api: { ping: jest.fn().mockResolvedValue({}) },
    },
    configureCloudinary: jest.fn(),
    checkCloudinaryConnection: jest.fn().mockResolvedValue({ status: 'connected' }),
    default: {},
}));

// Mock fs — existsSync returns true, unlinkSync is a no-op
jest.unstable_mockModule('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
    unlinkSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
}));

const { uploadDetectionImage, deleteCloudinaryImage, deleteLocalFile } =
    await import('../services/cloudinary.service.js');

describe('Cloudinary Service', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('uploadDetectionImage()', () => {
        it('calls cloudinary uploader with correct folder', async () => {
            mockUpload.mockResolvedValueOnce({
                secure_url: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
                public_id:  'leopard-detections/camera-01/uuid-1',
                width: 1280,
                height: 720,
            });

            const result = await uploadDetectionImage('/tmp/alert_123.jpg', 'camera-01', 'uuid-1');

            expect(mockUpload).toHaveBeenCalledWith(
                '/tmp/alert_123.jpg',
                expect.objectContaining({
                    public_id: 'leopard-detections/camera-01/uuid-1',
                    resource_type: 'image',
                })
            );
            expect(result.url).toBe('https://res.cloudinary.com/demo/image/upload/test.jpg');
            expect(result.publicId).toBe('leopard-detections/camera-01/uuid-1');
        });

        it('throws if the file does not exist', async () => {
            const { existsSync } = await import('fs');
            existsSync.mockReturnValueOnce(false);

            await expect(uploadDetectionImage('/nonexistent/path.jpg')).rejects.toThrow(
                'Image file not found'
            );
            expect(mockUpload).not.toHaveBeenCalled();
        });
    });

    describe('deleteCloudinaryImage()', () => {
        it('returns true on successful deletion', async () => {
            mockDestroy.mockResolvedValueOnce({ result: 'ok' });
            const result = await deleteCloudinaryImage('leopard-detections/camera-01/uuid-1');
            expect(result).toBe(true);
        });

        it('returns false when result is not ok', async () => {
            mockDestroy.mockResolvedValueOnce({ result: 'not found' });
            const result = await deleteCloudinaryImage('nonexistent-id');
            expect(result).toBe(false);
        });

        it('returns false and does not throw on SDK error', async () => {
            mockDestroy.mockRejectedValueOnce(new Error('Network error'));
            const result = await deleteCloudinaryImage('some-id');
            expect(result).toBe(false);
        });
    });

    describe('deleteLocalFile()', () => {
        it('calls unlinkSync when file exists', async () => {
            const { existsSync, unlinkSync } = await import('fs');
            existsSync.mockReturnValueOnce(true);

            deleteLocalFile('/tmp/alert_123.jpg');

            expect(unlinkSync).toHaveBeenCalledWith('/tmp/alert_123.jpg');
        });

        it('does not throw when file does not exist', async () => {
            const { existsSync } = await import('fs');
            existsSync.mockReturnValueOnce(false);

            expect(() => deleteLocalFile('/nonexistent/file.jpg')).not.toThrow();
        });
    });
});
