import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '@/src/config/theme';
import * as messageService from '@/src/services/message.service';

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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
  },
  small: {
    height: 16,
    minWidth: 16,
  },
  medium: {
    height: 20,
    minWidth: 20,
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
});
