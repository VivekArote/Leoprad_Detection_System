import client from './axios';

/**
 * Fetch a paginated list of detections with filters.
 * @param {object} params 
 * @returns {Promise<object>}
 */
export const getDetections = async (params) => {
  const { data } = await client.get('/api/detections', { params });
  return data;
};

/**
 * Fetch details of a single detection event.
 * @param {string} id 
 * @returns {Promise<object>}
 */
export const getDetectionById = async (id) => {
  const { data } = await client.get(`/api/detections/${id}`);
  return data;
};

/**
 * Remove a detection from database and delete its Cloudinary file.
 * @param {string} id 
 * @returns {Promise<object>}
 */
export const deleteDetection = async (id) => {
  const { data } = await client.delete(`/api/detections/${id}`);
  return data;
};
