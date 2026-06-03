/**
 * @fileoverview Mongoose schema and model for leopard detection events.
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Bounding box sub-document schema.
 */
const BoundingBoxSchema = new Schema(
    {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
    },
    { _id: false }
);

/**
 * Detection event schema.
 */
const DetectionSchema = new Schema(
    {
        detectionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        timestamp: {
            type: Date,
            required: true,
            index: true,
        },
        detectionClass: {
            type: String,
            required: true,
            trim: true,
        },
        confidenceScore: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
            index: true,
        },
        cameraId: {
            type: String,
            required: true,
            trim: true,
            default: 'camera-01',
            index: true,
        },
        cameraLocation: {
            type: String,
            trim: true,
            default: 'Unknown',
        },
        imageUrl: {
            type: String,
            trim: true,
            default: null,
        },
        cloudinaryPublicId: {
            type: String,
            trim: true,
            default: null,
        },
        alertSent: {
            type: Boolean,
            default: false,
        },
        alertChannel: {
            type: String,
            trim: true,
            default: null,
        },
        processingTimeMs: {
            type: Number,
            default: 0,
        },
        boundingBox: {
            type: BoundingBoxSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
        collection: 'detections',
    }
);

// Compound indexes for common query patterns
DetectionSchema.index({ timestamp: -1, cameraId: 1 });
DetectionSchema.index({ confidenceScore: -1, timestamp: -1 });
DetectionSchema.index({ createdAt: -1 });

/**
 * @typedef {import('mongoose').Document & {
 *   detectionId: string,
 *   timestamp: Date,
 *   detectionClass: string,
 *   confidenceScore: number,
 *   cameraId: string,
 *   cameraLocation: string,
 *   imageUrl: string|null,
 *   cloudinaryPublicId: string|null,
 *   alertSent: boolean,
 *   alertChannel: string|null,
 *   processingTimeMs: number,
 *   boundingBox: { x: number, y: number, width: number, height: number },
 *   createdAt: Date,
 *   updatedAt: Date
 * }} DetectionDocument
 */

const Detection = model('Detection', DetectionSchema);

export default Detection;
