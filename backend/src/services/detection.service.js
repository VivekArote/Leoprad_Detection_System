/**
 * @fileoverview Detection service — orchestrates detection ingestion:
 * Cloudinary upload → MongoDB persistence → Telegram notification.
 *
 * The existing Python → Node pipeline posts to POST /detection (legacy endpoint).
 * This service is invoked from that route so nothing in the Python/Arduino side changes.
 */

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

import * as cloudinaryService from './cloudinary.service.js';
import * as detectionRepo from '../repositories/detection.repository.js';
import { detectionLogger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

/**
 * @typedef {object} RawDetectionPayload
 * @property {string} label          - e.g. "leopard_head"
 * @property {number} confidence     - 0–1
 * @property {string} timestamp      - "YYYY-MM-DD HH:mm:ss"
 * @property {string} [image_path]   - relative or absolute local path
 * @property {string} [camera_id]    - defaults to "camera-01"
 * @property {string} [camera_location]
 * @property {object} [bounding_box] - { x, y, width, height }
 */

/**
 * Processes an incoming detection event end-to-end:
 * 1. Upload image to Cloudinary
 * 2. Persist record to MongoDB
 * 3. Return enriched data (Cloudinary URL, detectionId)
 *
 * Telegram notification is handled by the caller (route/controller) so the
 * existing bot.telegram.sendPhoto() call remains intact.
 *
 * @param {RawDetectionPayload} payload
 * @returns {Promise<{ detectionId: string, imageUrl: string|null, cloudinaryPublicId: string|null, detection: object }>}
 */
export async function processDetection(payload) {
    const startTime = Date.now();

    const detectionId = uuidv4();
    const cameraId = payload.camera_id || 'camera-01';

    let imageUrl = null;
    let cloudinaryPublicId = null;

    // ── Resolve local image path ──────────────────────────────────────────────
    let resolvedImagePath = null;
    if (payload.image_path) {
        resolvedImagePath = path.isAbsolute(payload.image_path)
            ? payload.image_path
            : path.join(ROOT_DIR, payload.image_path);
    }

    // ── Upload to Cloudinary ──────────────────────────────────────────────────
    if (resolvedImagePath && existsSync(resolvedImagePath)) {
        try {
            const uploaded = await cloudinaryService.uploadDetectionImage(
                resolvedImagePath,
                cameraId,
                detectionId
            );
            imageUrl = uploaded.url;
            cloudinaryPublicId = uploaded.publicId;

            detectionLogger.info('📸 Detection image uploaded to Cloudinary', {
                detectionId,
                url: imageUrl,
            });

            // Delete temporary local file after successful upload
            cloudinaryService.deleteLocalFile(resolvedImagePath);
        } catch (uploadErr) {
            detectionLogger.error('❌ Cloudinary upload failed', {
                detectionId,
                error: uploadErr.message,
                stack: uploadErr.stack,
            });
        }
    }

    // ── Parse timestamp ───────────────────────────────────────────────────────
    let detectionTimestamp = new Date();
    if (payload.timestamp) {
        const parsed = new Date(payload.timestamp);
        if (!isNaN(parsed.getTime())) {
            detectionTimestamp = parsed;
        }
    }

    // ── Persist to MongoDB ────────────────────────────────────────────────────
    const processingTimeMs = Date.now() - startTime;

    const detectionData = {
        detectionId,
        timestamp: detectionTimestamp,
        detectionClass: payload.label,
        confidenceScore: payload.confidence,
        cameraId,
        cameraLocation: payload.camera_location || 'Unknown',
        imageUrl,
        cloudinaryPublicId,
        alertSent: false,        // updated to true after Telegram send
        alertChannel: 'telegram',
        processingTimeMs,
        boundingBox: payload.bounding_box || { x: 0, y: 0, width: 0, height: 0 },
    };

    const detection = await detectionRepo.createDetection(detectionData);

    detectionLogger.info('💾 Detection saved to MongoDB', {
        detectionId,
        class: payload.label,
        confidence: payload.confidence,
    });

    return {
        detectionId,
        imageUrl,
        cloudinaryPublicId,
        resolvedImagePath,
        detection,
    };
}

/**
 * Marks a detection as alert-sent in MongoDB.
 *
 * @param {string} detectionId
 * @param {boolean} [alertSent=true]
 * @returns {Promise<void>}
 */
export async function markAlertSent(detectionId, alertSent = true) {
    await detectionRepo.updateDetection(detectionId, { alertSent });
}

/**
 * Retrieves a paginated list of detections with optional filters.
 *
 * @param {object} query - Validated query params from the controller.
 * @returns {Promise<object>}
 */
export async function listDetections(query = {}) {
    const {
        page = 1,
        limit = 20,
        sortBy = 'timestamp',
        sortOrder = 'desc',
        cameraId,
        minConfidence,
        maxConfidence,
        startDate,
        endDate,
    } = query;

    const filters = {};

    if (cameraId) filters.cameraId = cameraId;

    if (minConfidence !== undefined || maxConfidence !== undefined) {
        filters.confidenceScore = {};
        if (minConfidence !== undefined) filters.confidenceScore.$gte = Number(minConfidence);
        if (maxConfidence !== undefined) filters.confidenceScore.$lte = Number(maxConfidence);
    }

    if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.$gte = new Date(startDate);
        if (endDate) filters.timestamp.$lte = new Date(endDate);
    }

    return detectionRepo.findDetections(filters, {
        page: Number(page),
        limit: Math.min(Number(limit), 100),
        sortBy,
        sortOrder,
    });
}

/**
 * Retrieves a single detection by ID.
 *
 * @param {string} detectionId
 * @returns {Promise<object|null>}
 */
export async function getDetectionById(detectionId) {
    return detectionRepo.findDetectionById(detectionId);
}

/**
 * Deletes a detection and its associated Cloudinary image.
 *
 * @param {string} detectionId
 * @returns {Promise<boolean>}
 */
export async function removeDetection(detectionId) {
    const detection = await detectionRepo.findDetectionById(detectionId);
    if (!detection) return false;

    // Remove from Cloudinary if we have a public ID
    if (detection.cloudinaryPublicId) {
        await cloudinaryService.deleteCloudinaryImage(detection.cloudinaryPublicId);
    }

    return detectionRepo.deleteDetectionById(detectionId);
}

export default {
    processDetection,
    markAlertSent,
    listDetections,
    getDetectionById,
    removeDetection,
};
