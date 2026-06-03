/**
 * @fileoverview Leopard Detection System — Production Server
 *
 * Backward-compatible entry point that preserves the original:
 *   • POST /detection   (Python pipeline → this server)
 *   • GET  /test-telegram
 *   • Arduino serial support (existing ENV var: ARDUINO_PORT)
 *   • Telegram bot notifications
 *
 * New additions (mounted cleanly alongside existing routes):
 *   • POST/GET /api/detections, GET /api/analytics/*, GET /health/*
 *   • MongoDB persistence via Mongoose
 *   • Cloudinary image storage
 *   • Winston structured logging
 *   • Tailwind CSS dashboard at /dashboard
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Telegraf } from 'telegraf';

// ── Internal modules ──────────────────────────────────────────────────────────
import logger from './src/utils/logger.js';
import { connectDatabase } from './src/config/database.js';
import { configureCloudinary } from './src/config/cloudinary.js';
import requestLogger from './src/middleware/requestLogger.js';
import errorHandler from './src/middleware/errorHandler.js';

import detectionRoutes from './src/routes/detection.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import healthRoutes from './src/routes/health.routes.js';

import { injectTelegramBot } from './src/controllers/detection.controller.js';
import { injectTelegramForHealth } from './src/controllers/health.controller.js';

import { initSocket } from './src/config/socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Environment validation ────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_IDS  = (process.env.TELEGRAM_CHAT_ID || '').split(',').map(id => id.trim()).filter(Boolean);

if (!BOT_TOKEN) {
    logger.error('❌ TELEGRAM_BOT_TOKEN missing in .env');
    process.exit(1);
}
if (!CHAT_IDS.length) {
    logger.error('❌ TELEGRAM_CHAT_ID missing in .env');
    process.exit(1);
}

// ── Express app & HTTP Server ─────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Enable CORS
app.use(cors());

// Security headers (CSP relaxed for CDN assets used by the dashboard)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc:  ["'self'"],
                scriptSrc:   ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://cdn.jsdelivr.net'],
                styleSrc:    ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com'],
                fontSrc:     ["'self'", 'https://cdnjs.cloudflare.com', 'https://ka-f.fontawesome.com'],
                imgSrc:      ["'self'", 'data:', 'https://res.cloudinary.com', 'https:'],
                connectSrc:  ["'self'"],
                workerSrc:   ["'self'", 'blob:'],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

// Request body limits & parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(requestLogger);

// Rate limiting — 200 req/min per IP on API routes
const apiLimiter = rateLimit({
    windowMs: 60_000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please slow down.' },
});

// ── Static dashboard ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'src/public')));

// ── Telegram bot ──────────────────────────────────────────────────────────────
const bot = new Telegraf(BOT_TOKEN);

bot.telegram.getMe()
    .then((me) => logger.info(`✅ Telegram bot connected: @${me.username}`))
    .catch((err) => logger.error('❌ Telegram bot connection failed', { error: err.message }));

// Inject bot into controllers that need it
injectTelegramBot(bot, CHAT_IDS);
injectTelegramForHealth(bot, CHAT_IDS[0]);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/detections', apiLimiter, detectionRoutes);
app.use('/api/analytics',  apiLimiter, analyticsRoutes);
app.use('/health',         healthRoutes);

// ── Legacy route — keeps Python pipeline working without any changes ──────────
// POST /detection  →  delegates to the same controller as POST /api/detections
import * as detectionController from './src/controllers/detection.controller.js';
import asyncHandler from './src/utils/asyncHandler.js';

app.post('/detection', asyncHandler(detectionController.createDetection));

// ── Dashboard ─────────────────────────────────────────────────────────────────
app.get(/^\/dashboard/, (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

// ── Root info page ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        name: 'Leopard Detection System',
        version: '2.0.0',
        dashboard: '/dashboard',
        health: '/health',
        api: {
            detections: '/api/detections',
            analytics: '/api/analytics/summary',
        },
    });
});

// ── Legacy test route ─────────────────────────────────────────────────────────
app.get('/test-telegram', async (req, res) => {
    try {
        await bot.telegram.sendMessage(CHAT_IDS[0], '✅ Test message from leopard detection server');
        res.json({ success: true, message: 'Telegram test sent' });
    } catch (err) {
        logger.error('❌ Test telegram failed', { error: err.response?.description || err.message });
        res.status(500).json({ success: false, message: err.response?.description || err.message });
    }
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Centralised error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3000;

async function bootstrap() {
    // MongoDB
    try {
        await connectDatabase();
    } catch (err) {
        logger.warn('⚠️  MongoDB unavailable — detections will NOT be persisted.', {
            error: err.message,
        });
    }

    // Cloudinary
    try {
        configureCloudinary();
    } catch (err) {
        logger.warn('⚠️  Cloudinary not configured — images will NOT be uploaded.', {
            error: err.message,
        });
    }

    httpServer.listen(PORT, () => {
        logger.info(`🚀 Leopard Detection Server ready on http://localhost:${PORT}`);
        logger.info(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
        logger.info(`🩺 Health:    http://localhost:${PORT}/health`);
    });
}

bootstrap().catch((err) => {
    logger.error('❌ Fatal startup error', { error: err.message });
    process.exit(1);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
    logger.info(`📴 ${signal} received — shutting down gracefully`);
    const { disconnectDatabase } = await import('./src/config/database.js');
    await disconnectDatabase();
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
    logger.error('💥 Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger.error('� Unhandled promise rejection', { reason: String(reason) });
    process.exit(1);
});
