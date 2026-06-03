/**
 * @fileoverview Cloudinary service — handles all upload/delete operations.
 * Business logic that concerns Cloudinary belongs here, never in controllers.
 */

import { existsSync, unlinkSync } from 'fs';
import path from 'path';
import { cloudinary } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

/**
 * Valid Cloudinary sub-folders within the leopard-detections/ root.
 */
export const CLOUDINARY_FOLDERS = {
    DEFAULT: 'leopard-detections/camera-01',
    CAMERA_01: 'leopard-detections/camera-01',
    CAMERA_02: 'leopard-detections/camera-02',
    REVIEW: 'leopard-detections/review',
    FALSE_POSITIVES: 'leopard-detections/false-positives',
    REPORTS: 'leopard-detections/reports',
};

/**
 * Resolves the Cloudinary folder path for a given camera ID.
 *
 * @param {string} cameraId
 * @returns {string}
 */
function resolveCameraFolder(cameraId) {
    const key = cameraId?.toUpperCase().replace('-', '_');
    return CLOUDINARY_FOLDERS[key] || CLOUDINARY_FOLDERS.DEFAULT;
}

/**
 * Uploads a local image file to Cloudinary.
 *
 * @param {string} localPath - Absolute or relative path to the local image.
 * @param {string} [cameraId='camera-01'] - Camera identifier used to select folder.
 * @param {string} [publicIdPrefix] - Optional public_id prefix (e.g. detection ID).
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
 * @throws {Error} If the file does not exist or the upload fails.
 */
export async function uploadDetectionImage(localPath, cameraId = 'camera-01', publicIdPrefix = null) {
    const isBase64 = localPath && typeof localPath === 'string' && localPath.startsWith('data:image/');

    if (!isBase64 && !existsSync(localPath)) {
        throw new Error(`Image file not found: ${localPath}`);
    }

    const folder = resolveCameraFolder(cameraId);
    const fileName = isBase64 ? `base64-${Date.now()}` : path.basename(localPath, path.extname(localPath));
    // public_id must NOT contain slashes — folder is set separately
    const publicId = publicIdPrefix || fileName;

    logger.info('☁️  Uploading image to Cloudinary', { localPath: isBase64 ? '[base64]' : localPath, folder, publicId });

    const result = await cloudinary.uploader.upload(localPath, {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        tags: ['leopard-detection', cameraId],
    });

    logger.info('✅ Cloudinary upload successful', {
        url: result.secure_url,
        publicId: result.public_id,
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
    };
}

/**
 * Deletes an image from Cloudinary by its public ID.
 *
 * @param {string} publicId
 * @returns {Promise<boolean>} True if successfully deleted.
 */
export async function deleteCloudinaryImage(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        const success = result.result === 'ok';

        if (success) {
            logger.info('🗑️  Cloudinary image deleted', { publicId });
        } else {
            logger.warn('⚠️  Cloudinary delete returned non-ok result', { publicId, result: result.result });
        }

        return success;
    } catch (err) {
        logger.error('❌ Cloudinary delete failed', { publicId, error: err.message });
        return false;
    }
}

/**
 * Deletes a local file from disk safely.
 *
 * @param {string} filePath - Path to the local file.
 * @returns {void}
 */
export function deleteLocalFile(filePath) {
    try {
        if (filePath && existsSync(filePath)) {
            unlinkSync(filePath);
            logger.info('🗑️  Local file deleted', { filePath });
        }
    } catch (err) {
        logger.warn('⚠️  Could not delete local file', { filePath, error: err.message });
    }
}

export default {
    uploadDetectionImage,
    deleteCloudinaryImage,
    deleteLocalFile,
    CLOUDINARY_FOLDERS,
};
