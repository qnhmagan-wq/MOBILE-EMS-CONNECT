/**
 * TimelineItem Component
 *
 * Displays a single item in a timeline with icon, label, and time information
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '@/src/config/theme';
import { getRelativeTime, formatDateTime } from '@/src/utils/time';

interface TimelineItemProps {
  label: string;
  time: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isLast?: boolean;
}

export default function TimelineItem({ label, time, icon, color, isLast = false }: TimelineItemProps) {
  const timeAgo = time ? getRelativeTime(time) : null;
  const formattedTime = time ? formatDateTime(time) : null;

  return (
    <View style={styles.container}>
      {/* Icon column with vertical line */}
      <View style={styles.iconColumn}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {!isLast && <View style={[styles.verticalLine, { backgroundColor: color }]} />}
      </View>

      {/* Content column */}
      <View style={styles.contentColumn}>
        <Text style={styles.label}>{label}</Text>
        {formattedTime ? (
          <>
            <Text style={styles.time}>{formattedTime}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </>
        ) : (
          <Text style={styles.pending}>Pending</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  iconColumn: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  time: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  pending: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
