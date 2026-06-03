import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity 
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getSummary, getDailyTrends, getCamerasStats } from '../api/analyticsApi';
import { useServer } from '../context/ServerContext';
import LoadingView from '../components/LoadingView';
import ErrorState from '../components/ErrorState';

export default function AnalyticsScreen() {
  const { serverUrl } = useServer();
  const [daysRange, setDaysRange] = useState(7); // 7 or 30 days filter

  // Fetch top-level summaries
  const { 
    data: summary, 
    isLoading: loadingSummary, 
    isError: isSummaryError,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ['analyticsSummary', serverUrl],
    queryFn: getSummary,
  });

  // Fetch daily trends
  const { 
    data: trends, 
    isLoading: loadingTrends, 
    isError: isTrendsError,
    refetch: refetchTrends
  } = useQuery({
    queryKey: ['analyticsTrends', serverUrl, daysRange],
    queryFn: () => getDailyTrends(daysRange),
  });

  // Fetch camera distribution comparison
  const { 
    data: cameraStats, 
    isLoading: loadingCameras, 
    isError: isCamerasError,
    refetch: refetchCameras
  } = useQuery({
    queryKey: ['analyticsCameras', serverUrl],
    queryFn: getCamerasStats,
  });

  const isLoading = loadingSummary || loadingTrends || loadingCameras;
  const isError = isSummaryError || isTrendsError || isCamerasError;

  const handleRefresh = async () => {
    await Promise.all([
      refetchSummary(),
      refetchTrends(),
      refetchCameras()
    ]);
  };

  if (isLoading) {
    return <LoadingView message="Assembling analytics matrix..." />;
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Analytics stream unavailable" onRetry={handleRefresh} />
      </View>
    );
  }

  // Summary variables
  const totalDetections = summary?.totalDetections || 0;
  const last7DaysCount = summary?.last7DaysCount || 0;
  const last30DaysCount = summary?.last30DaysCount || 0;
  const averageConfidence = summary?.averageConfidence ? (summary.averageConfidence * 100).toFixed(1) : '0';

  // Render a vertical bar chart
  const renderTrendsChart = () => {
    const rawData = trends || [];
    if (rawData.length === 0) {
      return <Text style={styles.chartEmptyText}>No trend metrics returned</Text>;
    }

    // Find max value to scale heights
    const maxVal = Math.max(...rawData.map(d => d.count), 1);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.barArea}>
          {rawData.map((item, idx) => {
            const barHeight = (item.count / maxVal) * 120; // max height 120dp
            // Format date label (e.g. "Jun 03" -> "03")
            const label = item._id ? item._id.split('-')[2] : '';
            return (
              <View key={idx} style={styles.barCol}>
                <Text style={styles.barCount}>{item.count}</Text>
                <View style={[styles.bar, { height: Math.max(barHeight, 4) }]} />
                <Text style={styles.barLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.xAxisLabel}>TIMELINE DAY UNITS (DATE)</Text>
      </View>
    );
  };

  // Render horizontal comparison bars for cameras
  const renderCameraStats = () => {
    const rawData = cameraStats || [];
    if (rawData.length === 0) {
      return <Text style={styles.chartEmptyText}>No camera sensor statistics available</Text>;
    }

    const maxVal = Math.max(...rawData.map(d => d.count), 1);

    return (
      <View style={styles.horizontalChart}>
        {rawData.map((item, idx) => {
          const barWidth = `${(item.count / maxVal) * 65}%`; // limit to 65% width
          return (
            <View key={idx} style={styles.hRow}>
              <Text style={styles.hLabel}>{item._id?.toUpperCase()}</Text>
              <View style={styles.hBarContainer}>
                <View style={[styles.hBar, { width: barWidth }]} />
                <Text style={styles.hValue}>{item.count} DET</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#38bdf8" />
      }
    >
      {/* Top statistics matrix */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>OBSERVATION METRICS OVERVIEW</Text>
        <View style={styles.grid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL LOGS</Text>
            <Text style={styles.statVal}>{totalDetections}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVG CONF</Text>
            <Text style={styles.statVal}>{averageConfidence}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>7-DAY INFS</Text>
            <Text style={styles.statVal}>{last7DaysCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>30-DAY INFS</Text>
            <Text style={styles.statVal}>{last30DaysCount}</Text>
          </View>
        </View>
      </View>

      {/* Daily trend bar chart */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>DAILY INFERENCE FREQUENCY</Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity 
              style={[styles.toggleBtn, daysRange === 7 && styles.toggleActive]}
              onPress={() => setDaysRange(7)}
            >
              <Text style={[styles.toggleText, daysRange === 7 && styles.toggleTextActive]}>7D</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, daysRange === 30 && styles.toggleActive]}
              onPress={() => setDaysRange(30)}
            >
              <Text style={[styles.toggleText, daysRange === 30 && styles.toggleTextActive]}>30D</Text>
            </TouchableOpacity>
          </View>
        </View>
        {renderTrendsChart()}
      </View>

      {/* Camera comparison bar chart */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>STATION TRAFFIC COMPARISON</Text>
        {renderCameraStats()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  panelTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleActive: {
    backgroundColor: '#1e293b',
  },
  toggleText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#64748b',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#38bdf8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
  },
  statVal: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  barArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 2,
    width: '100%',
    justifyContent: 'center',
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barCount: {
    fontFamily: 'monospace',
    fontSize: 7.5,
    color: '#38bdf8',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  bar: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    width: 14,
  },
  barLabel: {
    fontFamily: 'monospace',
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 4,
  },
  xAxisLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#475569',
    marginTop: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  chartEmptyText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#475569',
    textAlign: 'center',
    paddingVertical: 20,
  },
  horizontalChart: {
    marginTop: 8,
    gap: 10,
  },
  hRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hLabel: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    color: '#94a3b8',
    width: '30%',
    fontWeight: 'bold',
  },
  hBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hBar: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#f43f5e',
    height: 14,
  },
  hValue: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#f8fafc',
    fontWeight: 'bold',
  },
});
