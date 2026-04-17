/**
 * ArrivingBanner
 *
 * Floating banner shown to responders when they are within the arrival
 * geofence of an active dispatch (<= 100m to scene). Driven by
 * DispatchContext's arrivingDispatchId + liveDistances state.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from '@/src/contexts/DispatchContext';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';
import { formatDistance } from '@/src/utils/distance';

export const ArrivingBanner: React.FC = () => {
  const { arrivingDispatchId, liveDistances, dispatches } = useDispatch();

  if (arrivingDispatchId == null) return null;

  const dispatch = dispatches.find((d) => d.id === arrivingDispatchId);
  if (!dispatch) return null;

  const meters = liveDistances[arrivingDispatchId];
  const address = dispatch.incident?.address || 'incident';

  return (
    <SafeAreaView pointerEvents="none" style={styles.safeArea}>
      <View style={styles.banner}>
        <Ionicons
          name="navigate-circle"
          size={22}
          color={Colors.textWhite}
          style={styles.icon}
        />
        <View style={styles.textColumn}>
          <Text style={styles.title} numberOfLines={1}>
            Arriving at {address}
          </Text>
          {typeof meters === 'number' && (
            <Text style={styles.subtitle}>{formatDistance(meters)} away</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const ANDROID_STATUS_BAR = StatusBar.currentHeight ?? 24;

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: Platform.OS === 'android' ? ANDROID_STATUS_BAR : 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Platform.OS === 'android' ? Spacing.md : Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textWhite,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 1,
  },
});
