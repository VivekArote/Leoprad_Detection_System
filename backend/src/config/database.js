/**
 * @fileoverview MongoDB connection configuration using Mongoose.
 * Manages connection lifecycle with retry logic and graceful shutdown.
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/** @type {boolean} */
let isConnected = false;

/**
 * Establishes a connection to MongoDB.
 * Retries up to maxRetries times with exponential back-off.
 *
 * @param {number} [retries=5] - Number of retry attempts.
 * @returns {Promise<void>}
 */
export async function connectDatabase(retries = 5) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            isConnected = true;
            logger.info('✅ MongoDB connected successfully');

            // Connection event listeners
            mongoose.connection.on('disconnected', () => {
                isConnected = false;
                logger.warn('⚠️  MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                isConnected = true;
                logger.info('✅ MongoDB reconnected');
            });

            mongoose.connection.on('error', (err) => {
                logger.error('❌ MongoDB connection error:', { error: err.message });
            });

            return;
        } catch (err) {
            logger.error(`❌ MongoDB connection attempt ${attempt}/${retries} failed:`, {
                error: err.message,
            });

            if (attempt < retries) {
                const delay = Math.min(1000 * 2 ** attempt, 30000);
                logger.info(`🔄 Retrying in ${delay / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw new Error(`MongoDB connection failed after ${retries} attempts: ${err.message}`);
            }
        }
    }
}

/**
 * Gracefully closes the MongoDB connection.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        isConnected = false;
        logger.info('🔌 MongoDB connection closed');
    }
}

/**
 * Returns the current connection status.
 *
 * @returns {{ status: string, isConnected: boolean }}
 */
export function getDatabaseStatus() {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };

    return {
        status: states[mongoose.connection.readyState] || 'unknown',
        isConnected: mongoose.connection.readyState === 1,
    };
}

export default { connectDatabase, disconnectDatabase, getDatabaseStatus };
