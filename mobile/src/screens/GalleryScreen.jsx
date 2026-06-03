import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Modal, 
  Image, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getDetections } from '../api/detectionApi';
import { useServer } from '../context/ServerContext';
import ImageCard from '../components/ImageCard';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

const { width, height } = Dimensions.get('window');

export default function GalleryScreen() {
  const { serverUrl } = useServer();
  const [page, setPage] = useState(1);
  const [activePhoto, setActivePhoto] = useState(null);

  const limit = 16; // 16 items per page fits grid well

  // Query detections for gallery (requesting only those with image URLs)
  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    isFetching 
  } = useQuery({
    queryKey: ['galleryDetections', serverUrl, page],
    queryFn: () => getDetections({
      page,
      limit,
      // We only want images in the gallery
      hasImage: true 
    }),
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (data?.totalPages && page < data.totalPages) setPage(page + 1);
  };

  const listData = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <View style={styles.container}>
      {/* Page Title */}
      <View style={styles.topBar}>
        <Text style={styles.title}>SURVEILLANCE IMAGE GALLERY</Text>
        <Text style={styles.subtitle}>ALL DETECTED LEOPARD CAMERA FRAMES</Text>
      </View>

      {/* Grid List */}
      {isLoading ? (
        <LoadingView message="Loading cloud images..." />
      ) : isError ? (
        <View style={styles.centered}>
          <ErrorState message="Failed to load gallery images" onRetry={handleRefresh} />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState message="No detection images available" />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.detectionId}
          renderItem={({ item }) => (
            <ImageCard 
              detection={item}
              onPress={() => setActivePhoto(item)}
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          refreshing={isFetching}
          onRefresh={handleRefresh}
        />
      )}

      {/* Grid Pagination Control */}
      {!isLoading && !isError && totalItems > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity 
            style={[styles.pagBtn, page <= 1 && styles.pagBtnDisabled]} 
            onPress={handlePrevPage}
            disabled={page <= 1}
          >
            <Text style={[styles.pagBtnText, page <= 1 && styles.pagBtnTextDisabled]}>PREV</Text>
          </TouchableOpacity>
          
          <Text style={styles.pagInfo}>
            PAGE {page} OF {totalPages} ({totalItems} FRAMES)
          </Text>
          
          <TouchableOpacity 
            style={[styles.pagBtn, page >= totalPages && styles.pagBtnDisabled]} 
            onPress={handleNextPage}
            disabled={page >= totalPages}
          >
            <Text style={[styles.pagBtnText, page >= totalPages && styles.pagBtnTextDisabled]}>NEXT</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full-Screen Image Lightbox Modal */}
      <Modal
        visible={!!activePhoto}
        transparent={true}
        onRequestClose={() => setActivePhoto(null)}
        animationType="fade"
      >
        {activePhoto && (
          <View style={styles.lightboxOverlay}>
            {/* Close touch area */}
            <TouchableOpacity 
              style={styles.lightboxCloseBg} 
              onPress={() => setActivePhoto(null)} 
            />

            <View style={styles.lightboxContainer}>
              <Image 
                source={{ uri: activePhoto.imageUrl }} 
                style={styles.lightboxImage} 
                resizeMode="contain" 
              />
              
              {/* Overlay Metadata */}
              <View style={styles.lightboxMeta}>
                <Text style={styles.lightboxTitle}>
                  {activePhoto.detectionClass?.toUpperCase()} ({(activePhoto.confidenceScore * 100).toFixed(0)}%)
                </Text>
                <Text style={styles.lightboxText}>
                  STATION: {activePhoto.cameraId}
                </Text>
                <Text style={styles.lightboxText}>
                  TIME: {new Date(activePhoto.timestamp).toLocaleString()}
                </Text>
                
                <TouchableOpacity 
                  style={styles.lightboxCloseBtn} 
                  onPress={() => setActivePhoto(null)}
                >
                  <Text style={styles.lightboxCloseBtnText}>CLOSE PREVIEW</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topBar: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  gridContent: {
    padding: 12,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pagBtn: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pagBtnDisabled: {
    borderColor: '#1e293b',
    backgroundColor: '#090d16',
  },
  pagBtnText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  pagBtnTextDisabled: {
    color: '#475569',
  },
  pagInfo: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  lightboxContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
  },
  lightboxImage: {
    width: '100%',
    height: height * 0.45,
    backgroundColor: '#090d16',
  },
  lightboxMeta: {
    marginTop: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  lightboxTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  lightboxText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#94a3b8',
  },
  lightboxCloseBtn: {
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 10,
    alignItems: 'center',
  },
  lightboxCloseBtnText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});
