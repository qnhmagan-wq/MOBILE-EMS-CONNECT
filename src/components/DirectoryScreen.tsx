import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';
import { NearbyHospital } from '@/src/types/dispatch.types';
import * as dispatchService from '@/src/services/dispatch.service';

/**
 * Haversine distance between two coordinates in km
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

type DirectoryTab = 'hospitals' | 'fire_stations' | 'police_stations';

const TABS: { key: DirectoryTab; label: string; icon: string; available: boolean }[] = [
  { key: 'hospitals', label: 'Hospitals', icon: 'medical', available: true },
  { key: 'fire_stations', label: 'Fire Stations', icon: 'flame', available: false },
  { key: 'police_stations', label: 'Police', icon: 'shield', available: false },
];

export default function DirectoryScreen() {
  const [activeTab, setActiveTab] = useState<DirectoryTab>('hospitals');
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Unable to find nearby facilities.');
        return null;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setUserLocation(coords);
      return coords;
    } catch (err: any) {
      setError('Unable to get your location. Please check GPS settings.');
      return null;
    }
  }, []);

  const fetchHospitals = useCallback(async (coords: { latitude: number; longitude: number }) => {
    try {
      setError(null);
      const response = await dispatchService.getNearbyHospitals(coords.latitude, coords.longitude, 50);
      const hospitalsWithDistance = (response.hospitals || []).map((h) => {
        if (h.distance_text) return h;
        const distKm = calculateDistanceKm(coords.latitude, coords.longitude, h.latitude, h.longitude);
        return {
          ...h,
          distance_meters: Math.round(distKm * 1000),
          distance_text: formatDistance(distKm),
        };
      });
      hospitalsWithDistance.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
      setHospitals(hospitalsWithDistance);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load nearby hospitals.');
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const coords = await fetchLocation();
    if (coords) {
      await fetchHospitals(coords);
    }
    setIsLoading(false);
  }, [fetchLocation, fetchHospitals]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const coords = userLocation || await fetchLocation();
    if (coords) {
      await fetchHospitals(coords);
    }
    setIsRefreshing(false);
  }, [userLocation, fetchLocation, fetchHospitals]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side search filter
  const filteredHospitals = hospitals.filter((h) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return h.name.toLowerCase().includes(query) || h.address.toLowerCase().includes(query);
  });

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleDirections = (hospital: NearbyHospital) => {
    const url = `https://maps.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  const renderHospitalItem = ({ item }: { item: NearbyHospital }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.hospitalCard}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.hospitalHeader}>
          <View style={styles.hospitalIcon}>
            <Ionicons name="medical" size={22} color="#3B82F6" />
          </View>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalName} numberOfLines={isExpanded ? undefined : 1}>{item.name}</Text>
            <Text style={styles.hospitalAddress} numberOfLines={isExpanded ? undefined : 1}>{item.address}</Text>
          </View>
          {item.distance_text && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{item.distance_text}</Text>
            </View>
          )}
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.phone_number && (
              <View style={styles.detailRow}>
                <Ionicons name="call" size={16} color={Colors.textSecondary} />
                <Text style={styles.detailText}>{item.phone_number}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>
                {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {item.phone_number && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCall(item.phone_number)}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.directionsButton]}
                onPress={() => handleDirections(item)}
              >
                <Ionicons name="navigate" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Directory</Text>
        <Text style={styles.headerSubtitle}>Find nearby emergency facilities</Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              !tab.available && styles.tabDisabled,
            ]}
            onPress={() => {
              if (!tab.available) {
                Alert.alert('Coming Soon', `${tab.label} directory will be available in a future update.`);
                return;
              }
              setActiveTab(tab.key);
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#fff' : tab.available ? Colors.textSecondary : Colors.textLight}
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
              !tab.available && styles.tabTextDisabled,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or address..."
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding nearby hospitals...</Text>
        </View>
      ) : error && hospitals.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredHospitals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderHospitalItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="search" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No hospitals match your search' : 'No hospitals found nearby'}
              </Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {filteredHospitals.length} hospital{filteredHospitals.length !== 1 ? 's' : ''} found
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextDisabled: {
    color: Colors.textLight,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },

  // List
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  resultCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },

  // Hospital card
  hospitalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  hospitalInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  hospitalName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  hospitalAddress: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  distanceText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#3B82F6',
  },

  // Expanded content
  expandedContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: '#10B981',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
  },
  directionsButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },

  // States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
});
