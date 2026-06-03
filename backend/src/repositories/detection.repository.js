/**
 * @fileoverview Detection repository — all direct MongoDB access lives here.
 * Controllers and services must NOT query the database directly.
 */

import Detection from '../models/detection.model.js';
import logger from '../utils/logger.js';

/**
 * Persists a new detection document.
 *
 * @param {object} data - Detection fields matching DetectionDocument shape.
 * @returns {Promise<DetectionDocument>}
 */
export async function createDetection(data) {
    const detection = new Detection(data);
    return detection.save();
}

/**
 * Fetches paginated detection records with optional filters.
 *
 * @param {object} filters - MongoDB query filters.
 * @param {object} options
 * @param {number} options.page - 1-based page number.
 * @param {number} options.limit - Records per page.
 * @param {string} options.sortBy - Field name to sort by.
 * @param {'asc'|'desc'} options.sortOrder - Sort direction.
 * @returns {Promise<{ data: DetectionDocument[], total: number, page: number, totalPages: number }>}
 */
export async function findDetections(filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
        Detection.find(filters).sort(sort).skip(skip).limit(limit).lean(),
        Detection.countDocuments(filters),
    ]);

    return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Finds a single detection by its detectionId.
 *
 * @param {string} detectionId
 * @returns {Promise<DetectionDocument|null>}
 */
export async function findDetectionById(detectionId) {
    return Detection.findOne({ detectionId }).lean();
}

/**
 * Deletes a detection by its detectionId.
 *
 * @param {string} detectionId
 * @returns {Promise<boolean>} True if a document was deleted.
 */
export async function deleteDetectionById(detectionId) {
    const result = await Detection.deleteOne({ detectionId });
    return result.deletedCount > 0;
}

/**
 * Updates fields on an existing detection document.
 *
 * @param {string} detectionId
 * @param {object} updates - Partial detection fields.
 * @returns {Promise<DetectionDocument|null>}
 */
export async function updateDetection(detectionId, updates) {
    return Detection.findOneAndUpdate(
        { detectionId },
        { $set: updates },
        { returnDocument: 'after', lean: true }
    );
}

/**
 * Runs an arbitrary aggregation pipeline against the detections collection.
 *
 * @param {object[]} pipeline - MongoDB aggregation pipeline stages.
 * @returns {Promise<object[]>}
 */
export async function aggregate(pipeline) {
    return Detection.aggregate(pipeline);
}

/**
 * Counts documents matching the given filter.
 *
 * @param {object} filter
 * @returns {Promise<number>}
 */
export async function countDetections(filter = {}) {
    return Detection.countDocuments(filter);
}

export default {
    createDetection,
    findDetections,
    findDetectionById,
    deleteDetectionById,
    updateDetection,
    aggregate,
    countDetections,
};
