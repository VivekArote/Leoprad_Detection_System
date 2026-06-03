import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getDetections } from '../api/detectionApi';
import { useServer } from '../context/ServerContext';
import SearchBar from '../components/SearchBar';
import FilterModal from '../components/FilterModal';
import DetectionCard from '../components/DetectionCard';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function DetectionsScreen({ navigation }) {
  const { serverUrl } = useServer();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    cameraId: undefined,
    detectionClass: undefined,
    minConfidence: 50,
  });

  const limit = 10;

  // Query database detections using filters, page, and search
  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    isFetching 
  } = useQuery({
    queryKey: ['detectionsList', serverUrl, page, search, filters],
    queryFn: () => getDetections({
      page,
      limit,
      search: search || undefined,
      cameraId: filters.cameraId,
      detectionClass: filters.detectionClass,
      minConfidence: filters.minConfidence / 100, // convert percentage back to decimal [0, 1]
    }),
  });

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // reset to page 1
  };

  const handleClearFilters = () => {
    setFilters({
      cameraId: undefined,
      detectionClass: undefined,
      minConfidence: 50,
    });
    setPage(1);
  };

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
      {/* Search and Filter Panel */}
      <View style={styles.topControl}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar 
              value={search} 
              onChangeText={(text) => { setSearch(text); setPage(1); }} 
              placeholder="SEARCH BY CAMERA / CLASS..."
            />
          </View>
          <TouchableOpacity 
            style={[
              styles.filterBtn,
              (filters.cameraId || filters.detectionClass || filters.minConfidence > 50) && styles.filterBtnActive
            ]}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.filterBtnText}>FILTERS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filter Badges */}
      {(filters.cameraId || filters.detectionClass || filters.minConfidence > 50) && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersTitle}>ACTIVE FILTER ARRAYS:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeRow}>
            {filters.cameraId && (
              <View style={styles.badge}><Text style={styles.badgeText}>STATION: {filters.cameraId}</Text></View>
            )}
            {filters.detectionClass && (
              <View style={styles.badge}><Text style={styles.badgeText}>CLASS: {filters.detectionClass.replace('leopard_', '')}</Text></View>
            )}
            {filters.minConfidence > 50 && (
              <View style={styles.badge}><Text style={styles.badgeText}>CONF &gt; {filters.minConfidence}%</Text></View>
            )}
          </ScrollView>
        </View>
      )}

      {/* List Container */}
      {isLoading ? (
        <LoadingView message="Querying detection indices..." />
      ) : isError ? (
        <View style={styles.centered}>
          <ErrorState message="Failed to fetch detection logs" onRetry={handleRefresh} />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState message="No matching camera captures found" />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.detectionId}
          renderItem={({ item }) => (
            <DetectionCard 
              detection={item}
              onPress={() => navigation.navigate('DetectionDetails', { id: item.detectionId })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={handleRefresh}
        />
      )}

      {/* Monospaced Pagination Footer */}
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
            PAGE {page} OF {totalPages} ({totalItems} INFERENCES)
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

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
    </View>
  );
}

// Simple ScrollView mock since horizontal ScrollView is needed for filter badges
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  topControl: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterBtn: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterBtnActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#1e293b',
  },
  filterBtnText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 4,
  },
  activeFiltersTitle: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#475569',
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
});
