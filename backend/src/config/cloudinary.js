/**
 * @fileoverview Cloudinary configuration and initialisation.
 * The SDK is configured immediately on import so every service that
 * imports `cloudinary` gets a ready-to-use instance.
 * dotenv/config must be the first import in main.js (it already is).
 */

import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

// ── Configure immediately on module load ─────────────────────────────────────
// process.env is already populated because main.js imports 'dotenv/config' first.
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME.trim(),
        api_key:    CLOUDINARY_API_KEY.trim(),
        api_secret: CLOUDINARY_API_SECRET.trim(),
        secure: true,
    });
}

/**
 * Validates env vars and logs the result. Call once at startup for visibility.
 *
 * @throws {Error} If any required Cloudinary env var is missing.
 */
export function configureCloudinary() {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error(
            'Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
        );
    }
    logger.info('✅ Cloudinary configured successfully', {
        cloud_name: CLOUDINARY_CLOUD_NAME.trim(),
    });
}

/**
 * Checks Cloudinary connectivity by pinging the API.
 *
 * @returns {Promise<{ status: string, message?: string }>}
 */
export async function checkCloudinaryConnection() {
    try {
        await cloudinary.api.ping();
        return { status: 'connected' };
    } catch (err) {
        return { status: 'disconnected', message: err.message };
    }
}

export { cloudinary };
export default { configureCloudinary, checkCloudinaryConnection, cloudinary };
