/**
 * @fileoverview Health-check controller.
 * Provides endpoints to verify connectivity of all external dependencies.
 */

import { getDatabaseStatus } from '../config/database.js';
import { checkCloudinaryConnection } from '../config/cloudinary.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_PATH = path.resolve(__dirname, '../../src/vision/best.pt');

// Telegram bot reference — injected at startup
let _bot = null;
let _chatId = null;

/**
 * Injects the Telegraf bot for health checking.
 *
 * @param {import('telegraf').Telegraf} bot
 * @param {string} chatId - Any one valid chat ID for the ping test.
 */
export function injectTelegramForHealth(bot, chatId) {
    _bot = bot;
    _chatId = chatId;
}

// ── GET /health ───────────────────────────────────────────────────────────────

/**
 * Full system health overview.
 * @type {import('express').RequestHandler}
 */
export async function getHealth(req, res) {
    const [dbStatus, cloudinaryStatus, telegramStatus, modelStatus] = await Promise.all([
        checkDatabase(),
        checkCloudinary(),
        checkTelegram(),
        checkModel(),
    ]);

    const allHealthy =
        dbStatus.status === 'connected' &&
        cloudinaryStatus.status === 'connected' &&
        telegramStatus.status === 'connected' &&
        modelStatus.status === 'loaded';

    const payload = {
        success: allHealthy,
        database: dbStatus.status,
        cloudinary: cloudinaryStatus.status,
        telegram: telegramStatus.status,
        model: modelStatus.status,
        timestamp: new Date().toISOString(),
    };

    return res.status(allHealthy ? 200 : 503).json(payload);
}

// ── GET /health/database ──────────────────────────────────────────────────────

/** @type {import('express').RequestHandler} */
export async function getHealthDatabase(req, res) {
    const status = await checkDatabase();
    return res.status(status.status === 'connected' ? 200 : 503).json({ success: status.status === 'connected', ...status });
}

// ── GET /health/cloudinary ────────────────────────────────────────────────────

/** @type {import('express').RequestHandler} */
export async function getHealthCloudinary(req, res) {
    const status = await checkCloudinary();
    return res.status(status.status === 'connected' ? 200 : 503).json({ success: status.status === 'connected', ...status });
}

// ── GET /health/telegram ──────────────────────────────────────────────────────

/** @type {import('express').RequestHandler} */
export async function getHealthTelegram(req, res) {
    const status = await checkTelegram();
    return res.status(status.status === 'connected' ? 200 : 503).json({ success: status.status === 'connected', ...status });
}

// ── GET /health/model ─────────────────────────────────────────────────────────

/** @type {import('express').RequestHandler} */
export async function getHealthModel(req, res) {
    const status = await checkModel();
    return res.status(status.status === 'loaded' ? 200 : 503).json({ success: status.status === 'loaded', ...status });
}

// ── Internal check helpers ────────────────────────────────────────────────────

async function checkDatabase() {
    try {
        const { status } = getDatabaseStatus();
        return { status };
    } catch (err) {
        return { status: 'error', message: err.message };
    }
}

async function checkCloudinary() {
    try {
        return checkCloudinaryConnection();
    } catch (err) {
        return { status: 'error', message: err.message };
    }
}

async function checkTelegram() {
    if (!_bot) return { status: 'not_configured' };
    try {
        await _bot.telegram.getMe();
        return { status: 'connected' };
    } catch (err) {
        return { status: 'disconnected', message: err.message };
    }
}

async function checkModel() {
    const exists = existsSync(MODEL_PATH);
    return { status: exists ? 'loaded' : 'not_found', path: MODEL_PATH };
}
