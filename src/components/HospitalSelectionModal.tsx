/**
 * HospitalSelectionModal Component
 *
 * Modal for selecting a nearby hospital to assign to a dispatch.
 * Shows a list of hospitals sorted by distance from the incident.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';
import { NearbyHospital, HospitalRouteData } from '@/src/types/dispatch.types';
import * as dispatchService from '@/src/services/dispatch.service';
import { haversineMeters, formatDistance } from '@/src/utils/distance';

interface HospitalSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  dispatchId: number;
  latitude: number;
  longitude: number;
  currentHospitalId?: number;
  onHospitalSelected: (hospitalRoute: HospitalRouteData | null) => void;
}

export const HospitalSelectionModal: React.FC<HospitalSelectionModalProps> = ({
  visible,
  onClose,
  dispatchId,
  latitude,
  longitude,
  currentHospitalId,
  onHospitalSelected,
}) => {
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchNearbyHospitals();
    }
  }, [visible]);

  const fetchNearbyHospitals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dispatchService.getNearbyHospitals(latitude, longitude);
      // Compute distance client-side if backend doesn't include it
      const hospitalsWithDistance = (response.hospitals || []).map((h) => {
        if (h.distance_text) return h;
        const meters = haversineMeters(
          { latitude, longitude },
          { latitude: h.latitude, longitude: h.longitude }
        );
        return {
          ...h,
          distance_meters: Math.round(meters),
          distance_text: formatDistance(meters),
        };
      });
      // Sort by distance (closest first)
      hospitalsWithDistance.sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
      setHospitals(hospitalsWithDistance);
    } catch (err: any) {
      console.error('[HospitalSelection] Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load nearby hospitals.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHospital = (hospital: NearbyHospital) => {
    if (hospital.id === currentHospitalId) {
      onClose();
      return;
    }

    Alert.alert(
      'Change Hospital',
      `Assign "${hospital.name}" to this dispatch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsAssigning(hospital.id);
            try {
              const assignResponse = await dispatchService.assignHospital(dispatchId, hospital.id);

              // Fetch the updated route after assignment (assign clears cached route)
              try {
                const routeData = await dispatchService.getHospitalRoute(dispatchId);
                onHospitalSelected({ hospital: routeData.hospital, route: routeData.route });
              } catch (routeErr: any) {
                // Route fetch failed but hospital was assigned — show hospital info without route
                console.warn('[HospitalSelection] Route fetch after assign:', routeErr.message);
                const assignedHospital = assignResponse.dispatch?.hospital;
                if (assignedHospital) {
                  // Create a minimal HospitalRouteData with empty route so the card still shows
                  onHospitalSelected({
                    hospital: assignedHospital,
                    route: { distance_meters: 0, duration_seconds: 0, distance_text: 'Calculating...', duration_text: 'Calculating...', coordinates: [], method: 'haversine' as const },
                  });
                } else {
                  onHospitalSelected(null);
                }
                Alert.alert('Hospital Assigned', 'Hospital changed successfully. Route details will update shortly.');
              }
              onClose();
            } catch (err: any) {
              console.error('[HospitalSelection] Assign error:', err);
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to assign hospital. Please try again.'
              );
            } finally {
              setIsAssigning(null);
            }
          },
        },
      ]
    );
  };

  const renderHospitalItem = ({ item }: { item: NearbyHospital }) => {
    const isCurrent = item.id === currentHospitalId;
    return (
      <TouchableOpacity
        style={[styles.hospitalItem, isCurrent && styles.hospitalItemCurrent]}
        onPress={() => handleSelectHospital(item)}
        disabled={isAssigning !== null}
      >
        <View style={styles.hospitalIcon}>
          <Ionicons
            name="medical"
            size={24}
            color={isCurrent ? Colors.primary : '#3B82F6'}
          />
        </View>
        <View style={styles.hospitalInfo}>
          <View style={styles.hospitalNameRow}>
            <Text style={styles.hospitalName} numberOfLines={1}>
              {item.name}
            </Text>
            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>CURRENT</Text>
              </View>
            )}
          </View>
          <Text style={styles.hospitalAddress} numberOfLines={1}>
            {item.address}
          </Text>
          {item.distance_text && (
            <Text style={styles.hospitalDistance}>
              {item.distance_text}
            </Text>
          )}
        </View>
        {isAssigning === item.id ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Hospital</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Nearby hospitals sorted by distance
        </Text>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading hospitals...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNearbyHospitals}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : hospitals.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="medical" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No hospitals found nearby</Text>
          </View>
        ) : (
          <FlatList
            data={hospitals}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderHospitalItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
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
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: Spacing.lg,
  },
  separator: {
    height: Spacing.sm,
  },
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hospitalItemCurrent: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  hospitalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  hospitalName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textWhite,
  },
  hospitalAddress: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  hospitalDistance: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 2,
  },
});
