import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '@/src/config/theme';
import * as messageService from '@/src/services/message.service';
import { scale, scaleFontSize, scaleSpacing } from '@/src/utils/responsive';

interface UnreadBadgeProps {
  incidentId: number;
  size?: 'small' | 'medium';
}

export default function UnreadBadge({ incidentId, size = 'medium' }: UnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await messageService.getUnreadCount(incidentId);
        setUnreadCount(count);
      } catch (error) {
        console.error('[UnreadBadge] Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();

    // Poll every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [incidentId]);

  if (unreadCount === 0) return null;

  const sizeStyle = size === 'small' ? styles.small : styles.medium;

  return (
    <View style={[styles.badge, sizeStyle]}>
      <Text style={[styles.badgeText, size === 'small' && styles.smallText]}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.danger,
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: scale(20),
    paddingHorizontal: scaleSpacing(6),
  },
  small: {
    height: scale(16),
    minWidth: scale(16),
  },
  medium: {
    height: scale(20),
    minWidth: scale(20),
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: scaleFontSize(FontSizes.xs),
    fontWeight: '600',
  },
  smallText: {
    fontSize: scaleFontSize(10),
  },
});
