import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 40) / 2; // 2-column grid calculation

export default function ImageCard({ detection, onPress }) {
  const { imageUrl, confidenceScore, timestamp } = detection;

  const formattedDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>NO IMAGE</Text>
        </View>
      )}
      
      <View style={styles.overlay}>
        <Text style={styles.date}>{formattedDate(timestamp)}</Text>
        <Text style={styles.confidence}>{(confidenceScore * 100).toFixed(0)}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    margin: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#475569',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 13, 22, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  date: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#94a3b8',
  },
  confidence: {
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#f43f5e',
  },
});
