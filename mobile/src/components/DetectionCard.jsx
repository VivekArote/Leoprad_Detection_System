import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';

export default function DetectionCard({ detection, onPress }) {
  const {
    detectionClass,
    confidenceScore,
    cameraId,
    timestamp,
    imageUrl,
  } = detection;

  const formattedDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>NO IMAGE</Text>
        </View>
      )}
      
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.label}>{detectionClass?.replace('leopard_', '')?.toUpperCase()}</Text>
          <Text style={styles.confidence}>{(confidenceScore * 100).toFixed(0)}%</Text>
        </View>
        
        <Text style={styles.station}>STATION: {cameraId}</Text>
        <Text style={styles.time}>{formattedDate(timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  noImage: {
    width: 64,
    height: 64,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontFamily: 'monospace',
    fontSize: 7,
    color: '#64748b',
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  confidence: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f43f5e', // rose-500
  },
  station: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#94a3b8',
    marginBottom: 2,
  },
  time: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#64748b',
  },
});
