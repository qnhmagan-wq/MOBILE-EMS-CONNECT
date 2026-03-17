/**
 * DispatchStatusBadge Component
 *
 * Reusable component for displaying dispatch status with color-coded badges
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DispatchStatus } from '@/src/types/dispatch.types';
import { FontSizes, Spacing } from '@/src/config/theme';

interface DispatchStatusBadgeProps {
  status: DispatchStatus;
  size?: 'small' | 'medium' | 'large';
}

export const DispatchStatusBadge: React.FC<DispatchStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const getStatusConfig = (status: DispatchStatus) => {
    switch (status) {
      case 'assigned':
        return { label: 'NEW', color: '#EF4444' };
      case 'accepted':
        return { label: 'ACCEPTED', color: '#3B82F6' };
      case 'declined':
        return { label: 'DECLINED', color: '#6B7280' };
      case 'en_route':
        return { label: 'EN ROUTE', color: '#F59E0B' };
      case 'arrived':
        return { label: 'ON SCENE', color: '#8B5CF6' };
      case 'transporting_to_hospital':
        return { label: 'TRANSPORTING', color: '#3B82F6' };
      case 'completed':
        return { label: 'COMPLETED', color: '#10B981' };
      case 'cancelled':
        return { label: 'CANCELLED', color: '#6B7280' };
      default:
        return { label: (status as string).toUpperCase(), color: '#6B7280' };
    }
  };

  const sizeStyles = {
    small: { paddingHorizontal: Spacing.xs, paddingVertical: 2, fontSize: 10 },
    medium: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, fontSize: FontSizes.xs },
    large: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSizes.sm },
  };

  const config = getStatusConfig(status);
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.color,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: sizeStyle.fontSize }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
