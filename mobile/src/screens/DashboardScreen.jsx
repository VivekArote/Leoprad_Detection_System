import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  RefreshControl,
  Image, 
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDetections } from '../api/detectionApi';
import { getHealth } from '../api/healthApi';
import { useServer } from '../context/ServerContext';
import { useAuth } from '../context/AuthContext';
import StatusCard from '../components/StatusCard';
import DetectionCard from '../components/DetectionCard';
import LoadingView from '../components/LoadingView';
import ErrorState from '../components/ErrorState';

export default function DashboardScreen({ navigation }) {
  const queryClient = useQueryClient();
  const { connectionStatus, serverUrl, updateServerUrl } = useServer();
  const { logout } = useAuth();
  
  const [newIp, setNewIp] = React.useState(serverUrl);
  const [updating, setUpdating] = React.useState(false);

  // Keep newIp in sync when serverUrl loads
  React.useEffect(() => {
    setNewIp(serverUrl);
  }, [serverUrl]);

  // 1. Fetch system health diagnostics
  const { 
    data: healthData, 
    isLoading: loadingHealth, 
    isError: isHealthError,
    refetch: refetchHealth
  } = useQuery({
    queryKey: ['systemHealth', serverUrl],
    queryFn: getHealth,
    refetchInterval: 10000, // auto refresh telemetry every 10 seconds
  });

  // 2. Fetch recent detections (limit: 5)
  const { 
    data: detectionsData, 
    isLoading: loadingDetections, 
    isError: isDetectionsError,
    refetch: refetchDetections
  } = useQuery({
    queryKey: ['recentDetections', serverUrl],
    queryFn: () => getDetections({ limit: 5 }),
  });

  const isLoading = loadingHealth || loadingDetections;
  const isError = isHealthError && isDetectionsError;

  const handleRefresh = async () => {
    queryClient.invalidateQueries(['systemHealth']);
    queryClient.invalidateQueries(['recentDetections']);
    await Promise.all([refetchHealth(), refetchDetections()]);
  };

  // Helper to format date strings
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const recentList = detectionsData?.data || [];
  const latestDet = recentList[0] || null;

  if (isLoading) {
    return <LoadingView message="Loading dashboard data stream..." />;
  }

  if (isError) {
    const handleUpdateIp = async () => {
      if (!newIp.trim()) return;
      setUpdating(true);
      try {
        await updateServerUrl(newIp.trim());
        handleRefresh();
      } catch (err) {
        console.error('Failed to change server IP', err);
      } finally {
        setUpdating(false);
      }
    };

    return (
      <View style={styles.errorWrapper}>
        <ErrorState 
          message="Server connection failed. Verify server URL." 
          onRetry={handleRefresh} 
        />
        
        <View style={styles.ipPanel}>
          <Text style={styles.ipLabel}>MODIFY GATEWAY SERVER URL</Text>
          <TextInput
            style={styles.ipInput}
            value={newIp}
            onChangeText={setNewIp}
            placeholder="http://10.229.228.110:3000"
            placeholderTextColor="#475569"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.ipBtn} 
            onPress={handleUpdateIp}
            disabled={updating}
            activeOpacity={0.8}
          >
            <Text style={styles.ipBtnText}>
              {updating ? 'SAVING TELEMETRY CONFIG...' : 'UPDATE GATEWAY URL'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutErrorBtn} 
            onPress={logout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutErrorText}>RESET ACTIVE SESSION</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Extract component health metrics
  const dbStatus = healthData?.components?.database?.status || 'offline';
  const telegramStatus = healthData?.components?.notifications?.telegram?.status || 'offline';
  const arduinoStatus = healthData?.components?.hardware?.arduino?.status || 'offline';
  const yoloStatus = healthData?.components?.hardware?.cameras?.[0]?.status || 'running'; // Mock model health

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#38bdf8" />
      }
    >
      {/* Live Server URL bar */}
      <View style={styles.serverBar}>
        <Text style={styles.serverLabel}>GATEWAY:</Text>
        <Text style={styles.serverValue}>{serverUrl}</Text>
      </View>

      {/* System Status Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>SYSTEM HEALTH TELEMETRY</Text>
        <View style={styles.healthGrid}>
          <StatusCard label="Camera trap" status={arduinoStatus} />
          <StatusCard label="Database node" status={dbStatus} />
          <StatusCard label="Telegram bot" status={telegramStatus} />
          <StatusCard label="Yolo model" status={yoloStatus} />
        </View>
      </View>

      {/* Latest Detection Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>LATEST DETECTION PREVIEW</Text>
        
        {latestDet ? (
          <TouchableOpacity 
            style={styles.feedCard}
            onPress={() => navigation.navigate('DetectionDetails', { id: latestDet.detectionId })}
            activeOpacity={0.8}
          >
            {latestDet.imageUrl ? (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: latestDet.imageUrl }} 
                  style={styles.feedImage}
                  resizeMode="cover"
                />
                {latestDet.boundingBox && (
                  <View style={styles.bboxCoordinates}>
                    <Text style={styles.bboxText}>
                      BBOX: [{latestDet.boundingBox.x?.toFixed(1)}, {latestDet.boundingBox.y?.toFixed(1)}]
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Text style={styles.placeholderText}>NO IMAGE ATTACHED</Text>
              </View>
            )}
            
            <View style={styles.feedMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>IDENT TARGET:</Text>
                <Text style={styles.metaValueHighlight}>{latestDet.detectionClass?.replace('leopard_', '')?.toUpperCase()}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>CONFIDENCE:</Text>
                <Text style={styles.metaValue}>{(latestDet.confidenceScore * 100).toFixed(1)}%</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>STATION ID:</Text>
                <Text style={styles.metaValue}>{latestDet.cameraId}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>TIMESTAMP:</Text>
                <Text style={styles.metaValue}>{formatDate(latestDet.timestamp)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyText}>No detection events recorded.</Text>
        )}
      </View>

      {/* Recent Detections List */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>RECENT OBSERVATIONS STREAM</Text>
        {recentList.length > 0 ? (
          recentList.map((item) => (
            <DetectionCard 
              key={item.detectionId} 
              detection={item}
              onPress={() => navigation.navigate('DetectionDetails', { id: item.detectionId })}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Inference log stream empty.</Text>
        )}
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
  errorWrapper: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    padding: 16,
  },
  serverBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  serverLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginRight: 6,
  },
  serverValue: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#e2e8f0',
  },
  panel: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 16,
  },
  panelTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  healthGrid: {
    gap: 2,
  },
  feedCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  bboxCoordinates: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bboxText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#64748b',
  },
  feedMeta: {
    marginTop: 8,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  metaLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#64748b',
  },
  metaValue: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#e2e8f0',
  },
  metaValueHighlight: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#f43f5e',
    fontWeight: 'bold',
  },
  emptyText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    paddingVertical: 12,
  },
  ipPanel: {
    marginTop: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  ipLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 1,
  },
  ipInput: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#f8fafc',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  ipBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  ipBtnText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  logoutErrorBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  logoutErrorText: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});
