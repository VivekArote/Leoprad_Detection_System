import client from './axios';

/**
 * Fetch top-level dashboard metrics (totals, averages, counts).
 */
export const getSummary = async () => {
  const { data } = await client.get('/api/analytics/summary');
  return data.data;
};

/**
 * Fetch daily trends count.
 */
export const getDailyTrends = async (days = 30) => {
  const { data } = await client.get('/api/analytics/daily', { params: { days } });
  return data.data;
};

/**
 * Fetch weekly trends count.
 */
export const getWeeklyTrends = async (weeks = 12) => {
  const { data } = await client.get('/api/analytics/weekly', { params: { weeks } });
  return data.data;
};

/**
 * Fetch monthly trends count.
 */
export const getMonthlyTrends = async (months = 12) => {
  const { data } = await client.get('/api/analytics/monthly', { params: { months } });
  return data.data;
};

/**
 * Fetch confidence distribution histogram metrics.
 */
export const getConfidenceStats = async () => {
  const { data } = await client.get('/api/analytics/confidence');
  return data.data;
};

/**
 * Fetch camera comparison counts.
 */
export const getCamerasStats = async () => {
  const { data } = await client.get('/api/analytics/cameras');
  return data.data;
};
