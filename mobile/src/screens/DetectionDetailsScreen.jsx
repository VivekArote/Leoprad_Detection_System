import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDetectionById, deleteDetection } from '../api/detectionApi';
import { useServer } from '../context/ServerContext';
import LoadingView from '../components/LoadingView';
import ErrorState from '../components/ErrorState';

export default function DetectionDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { serverUrl } = useServer();
  const queryClient = useQueryClient();

  // Fetch single detection detail
  const { 
    data: detection, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['detectionDetails', id, serverUrl],
    queryFn: () => getDetectionById(id),
  });

  // Mutation to delete a detection
  const deleteMutation = useMutation({
    mutationFn: () => deleteDetection(id),
    onSuccess: () => {
      // Invalidate queries so lists refresh immediately
      queryClient.invalidateQueries(['recentDetections']);
      queryClient.invalidateQueries(['detectionsList']);
      queryClient.invalidateQueries(['galleryDetections']);
      Alert.alert('SUCCESS', 'DETECTION LOG COMPLETELY ERASED');
      navigation.goBack();
    },
    onError: (err) => {
      Alert.alert('ERROR', `ERASURE FAILED: ${err.message}`);
    }
  });

  const handleDelete = () => {
    Alert.alert(
      'CONFIRM DELETION',
      'ARE YOU SURE YOU WANT TO DELETE THIS DETECTION RECORD? THIS Action WILL ALSO DELETE THE CLOUDINARY IMAGE.',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'ERASE RECORD', style: 'destructive', onPress: () => deleteMutation.mutate() }
      ]
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <LoadingView message="Retrieving record contents..." />;
  }

  if (isError || !detection) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not find detection details" onRetry={refetch} />
      </View>
    );
  }

  const {
    detectionId,
    timestamp,
    detectionClass,
    confidenceScore,
    cameraId,
    cameraLocation,
    imageUrl,
    cloudinaryPublicId,
    alertSent,
    alertChannel,
    boundingBox,
    processingTimeMs
  } = detection;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Full Size Preview */}
      <View style={styles.imageCard}>
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.image} 
              resizeMode="contain" 
            />
            {boundingBox && (
              <View style={styles.bboxCoordinates}>
                <Text style={styles.bboxText}>
                  BOUNDS: X={boundingBox.x?.toFixed(1)} Y={boundingBox.y?.toFixed(1)} W={boundingBox.width?.toFixed(1)} H={boundingBox.height?.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Text style={styles.placeholderText}>NO IMAGE ATTACHED TO THIS EVENT</Text>
          </View>
        )}
      </View>

      {/* Metadata Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>CLASSIFICATION SPECS</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>DETECTION ID</Text>
          <Text style={styles.valueSelectable} selectable={true}>{detectionId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>IDENTIFIED Target</Text>
          <Text style={styles.valueHighlight}>{detectionClass?.toUpperCase()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>INFERENCE CONFIDENCE</Text>
          <Text style={styles.value}>{(confidenceScore * 100).toFixed(2)}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>INFERENCE DELAY</Text>
          <Text style={styles.value}>{processingTimeMs ? `${processingTimeMs} ms` : 'N/A'}</Text>
        </View>
      </View>

      {/* Station Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>CAMERA STATION INFO</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>STATION ID</Text>
          <Text style={styles.value}>{cameraId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GEOLOCATION / SITE</Text>
          <Text style={styles.value}>{cameraLocation}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>RECORDED TIMESTAMP</Text>
          <Text style={styles.value}>{formatDate(timestamp)}</Text>
        </View>
      </View>

      {/* Notifications Log */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>ALERT TRANSMISSION</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>TELEGRAM BOT PUSH</Text>
          <Text style={[styles.value, alertSent ? styles.textGreen : styles.textRed]}>
            {alertSent ? 'DISPATCHED SUCCESS' : 'FAILED / SKIPPED'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ALERT CHANNEL</Text>
          <Text style={styles.value}>{alertChannel?.toUpperCase() || 'TELEGRAM'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>CLOUDINARY PUBLIC ID</Text>
          <Text style={styles.valueSelectable} selectable={true}>{cloudinaryPublicId || 'NONE'}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={handleDelete}
        disabled={deleteMutation.isLoading}
        activeOpacity={0.8}
      >
        {deleteMutation.isLoading ? (
          <ActivityIndicator color="#ef4444" size="small" />
        ) : (
          <Text style={styles.deleteBtnText}>DELETE PERMANENTLY</Text>
        )}
      </TouchableOpacity>
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
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    padding: 24,
  },
  imageCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#090d16',
    position: 'relative',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bboxCoordinates: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(9, 13, 22, 0.9)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bboxText: {
    fontFamily: 'monospace',
    fontSize: 7.5,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#475569',
  },
  panel: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 12,
  },
  panelTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 6,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#090d16',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#64748b',
    width: '35%',
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#f8fafc',
    textAlign: 'right',
    width: '60%',
  },
  valueSelectable: {
    fontFamily: 'monospace',
    fontSize: 8.5,
    color: '#94a3b8',
    textAlign: 'right',
    width: '60%',
  },
  valueHighlight: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#f43f5e',
    textAlign: 'right',
    width: '60%',
  },
  textGreen: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  textRed: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deleteBtnText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 1.5,
  },
});
