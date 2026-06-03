import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

// ── Detections list query ────────────────────────────────────────────────────
export const useDetections = (params) => {
  return useQuery({
    queryKey: ['detections', params],
    queryFn: async () => {
      const { data } = await client.get('/api/detections', { params });
      return data;
    },
    keepPreviousData: true,
  });
};

// ── Single detection detail query ────────────────────────────────────────────
export const useDetectionDetail = (id) => {
  return useQuery({
    queryKey: ['detection', id],
    queryFn: async () => {
      const { data } = await client.get(`/api/detections/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

// ── Delete detection mutation ────────────────────────────────────────────────
export const useDeleteDetection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await client.delete(`/api/detections/${id}`);
    },
    onSuccess: () => {
      // Invalidate both lists and summaries
      queryClient.invalidateQueries(['detections']);
      queryClient.invalidateQueries(['analyticsSummary']);
      queryClient.invalidateQueries(['cameraAnalytics']);
    },
  });
};

// ── Analytics Summary Query ──────────────────────────────────────────────────
export const useAnalyticsSummary = () => {
  return useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: async () => {
      const { data } = await client.get('/api/analytics/summary');
      return data.data;
    },
  });
};

// ── Camera analytics query ───────────────────────────────────────────────────
export const useCameraAnalytics = () => {
  return useQuery({
    queryKey: ['cameraAnalytics'],
    queryFn: async () => {
      const { data } = await client.get('/api/analytics/cameras');
      return data.data;
    },
  });
};

// ── Daily trend query ────────────────────────────────────────────────────────
export const useDailyTrends = (days = 30) => {
  return useQuery({
    queryKey: ['dailyTrends', days],
    queryFn: async () => {
      const { data } = await client.get('/api/analytics/daily', { params: { days } });
      return data.data;
    },
  });
};

// ── Hourly trend query ───────────────────────────────────────────────────────
export const useHourlyTrends = (hours = 24) => {
  return useQuery({
    queryKey: ['hourlyTrends', hours],
    queryFn: async () => {
      const { data } = await client.get('/api/analytics/trends', { params: { hours } });
      return data.data;
    },
  });
};

// ── System Health check query ────────────────────────────────────────────────
export const useSystemHealth = (options = {}) => {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const { data } = await client.get('/health');
      return data;
    },
    ...options,
  });
};

// ── Weekly trend query ────────────────────────────────────────────────────────
export const useWeeklyTrends = (weeks = 12) => {
  return useQuery({
    queryKey: ['weeklyTrends', weeks],
    queryFn: async () => {
      const { data } = await client.get('/api/analytics/weekly', { params: { weeks } });
      return data.data;
    },
  });
};

// ── Monthly trend query ───────────────────────────────────────────────────────
export const useMonthlyTrends = (months = 12) => {
  return useQuery({
    queryKey: ['monthlyTrends', months],
    queryFn: async () => {
      const { data } = await client.get('/api/analytics/monthly', { params: { months } });
      return data.data;
    },
  });
};

// ── Confidence analytics query ────────────────────────────────────────────────
export const useConfidenceAnalytics = () => {
  return useQuery({
    queryKey: ['confidenceAnalytics'],
    queryFn: async () => {
      const { data } = await client.get('/api/analytics/confidence');
      return data.data;
    },
  });
};
