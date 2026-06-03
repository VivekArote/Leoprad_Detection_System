/**
 * @fileoverview Detection controller — HTTP layer only.
 * No database queries or Cloudinary logic here; delegates to services.
 */

import { Telegraf } from 'telegraf';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import * as detectionService from '../services/detection.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

// Re-use the existing Telegraf bot instance exported from main.js via a lazy ref.
// The bot is injected at app startup to avoid circular imports.
let _bot = null;
let _chatIds = [];

/**
 * Injects the Telegraf bot instance and chat IDs.
 * Called once during server bootstrap.
 *
 * @param {import('telegraf').Telegraf} bot
 * @param {string[]} chatIds
 */
export function injectTelegramBot(bot, chatIds) {
    _bot = bot;
    _chatIds = chatIds;
}

// ── POST /api/detections (and legacy POST /detection) ────────────────────────

/**
 * Handles an incoming detection event from the Python pipeline.
 *
 * @type {import('express').RequestHandler}
 */
export async function createDetection(req, res) {
    const payload = req.body;

    if (!payload?.label) {
        return sendError(res, 'Invalid detection data: label is required', 400);
    }

    logger.info('📥 Detection received', { label: payload.label, confidence: payload.confidence });

    // ── Respond immediately so the Python pipeline never times out ────────────
    // All heavy work (Cloudinary upload, MongoDB write, Telegram) runs after.
    res.status(200).json({ success: true, message: 'Detection received' });

    // ── Background processing ─────────────────────────────────────────────────
    setImmediate(async () => {
        let detectionId = null;
        let imageUrl = null;
        let resolvedImagePath = null;

        try {
            const result = await detectionService.processDetection(payload);
            detectionId = result.detectionId;
            imageUrl = result.imageUrl;
            resolvedImagePath = result.resolvedImagePath;

            // Broadcast real-time Socket.io notification
            if (result.detection) {
                try {
                    const { broadcastDetection } = await import('../config/socket.js');
                    broadcastDetection(result.detection);
                } catch (socketErr) {
                    logger.error('❌ Socket broadcast failed', { error: socketErr.message });
                }
            }
        } catch (err) {
            logger.error('❌ Detection processing failed', { error: err.message });
        }

        // ── Telegram notification (preserves existing behaviour) ──────────────
        const caption =
            `🐆 Leopard Detected\n` +
            `🏷️ Label: ${payload.label}\n` +
            `🎯 Confidence: ${(payload.confidence * 100).toFixed(1)}%\n` +
            `⏰ Time: ${payload.timestamp}`;

        let alertSent = false;

        if (_bot && _chatIds.length > 0) {
            for (const chatId of _chatIds) {
                try {
                    if (imageUrl) {
                        await _bot.telegram.sendPhoto(chatId, imageUrl, { caption });
                    } else if (resolvedImagePath && existsSync(resolvedImagePath)) {
                        await _bot.telegram.sendPhoto(
                            chatId,
                            { source: resolvedImagePath },
                            { caption }
                        );
                    } else {
                        await _bot.telegram.sendMessage(chatId, caption);
                    }
                    alertSent = true;
                    logger.info('✅ Telegram alert sent', { chatId });
                } catch (err) {
                    logger.error('❌ Telegram error', {
                        chatId,
                        error: err.response?.description || err.message,
                    });
                }
            }
        }

        // Mark alert status in MongoDB
        if (detectionId) {
            await detectionService.markAlertSent(detectionId, alertSent).catch(() => {});
        }
    });
}

// ── GET /api/detections ───────────────────────────────────────────────────────

/**
 * Returns a paginated list of detections.
 *
 * @type {import('express').RequestHandler}
 */
export async function getDetections(req, res) {
    const result = await detectionService.listDetections(req.query);
    return sendSuccess(
        res,
        result.data,
        'Detections retrieved',
        200,
        {
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
        }
    );
}

// ── GET /api/detections/:id ───────────────────────────────────────────────────

/**
 * Returns a single detection by detectionId.
 *
 * @type {import('express').RequestHandler}
 */
export async function getDetectionById(req, res) {
    const detection = await detectionService.getDetectionById(req.params.id);
    if (!detection) {
        return sendError(res, 'Detection not found', 404);
    }
    return sendSuccess(res, detection, 'Detection retrieved');
}

// ── DELETE /api/detections/:id ────────────────────────────────────────────────

/**
 * Deletes a detection and its Cloudinary image.
 *
 * @type {import('express').RequestHandler}
 */
export async function deleteDetection(req, res) {
    const deleted = await detectionService.removeDetection(req.params.id);
    if (!deleted) {
        return sendError(res, 'Detection not found', 404);
    }
    return sendSuccess(res, null, 'Detection deleted');
}
