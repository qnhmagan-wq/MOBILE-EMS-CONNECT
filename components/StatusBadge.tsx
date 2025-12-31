import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IncidentStatus } from '@/src/types/incident.types';

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'small' | 'medium' | 'large';
}

export const getStatusColor = (status: IncidentStatus) => {
  switch (status) {
    case 'pending':
      return { bg: '#fef3c7', text: '#92400e', label: 'Pending Review' };
    case 'dispatched':
      return { bg: '#dbeafe', text: '#1e40af', label: 'Dispatched' };
    case 'in_progress':
      return { bg: '#fef3c7', text: '#92400e', label: 'In Progress' };
    case 'completed':
      return { bg: '#d1fae5', text: '#065f46', label: 'Resolved' };
    case 'cancelled':
      return { bg: '#f3f4f6', text: '#374151', label: 'Cancelled' };
    default:
      return { bg: '#f3f4f6', text: '#374151', label: status };
  }
};

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const colors = getStatusColor(status);
  const fontSize = size === 'small' ? 10 : size === 'large' ? 14 : 12;
  const padding = size === 'small' ? 4 : size === 'large' ? 12 : 8;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, padding }]}>
      <Text style={[styles.text, { color: colors.text, fontSize }]}>
        {colors.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});




