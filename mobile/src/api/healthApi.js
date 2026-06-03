import client from './axios';

/**
 * Fetch top-level health diagnostics of all components.
 */
export const getHealth = async () => {
  const { data } = await client.get('/health');
  return data;
};

/**
 * Fetch database connection health.
 */
export const getDatabaseHealth = async () => {
  const { data } = await client.get('/health/database');
  return data;
};

/**
 * Fetch Cloudinary configuration health.
 */
export const getCloudinaryHealth = async () => {
  const { data } = await client.get('/health/cloudinary');
  return data;
};

/**
 * Fetch Telegram bot connectivity.
 */
export const getTelegramHealth = async () => {
  const { data } = await client.get('/health/telegram');
  return data;
};
