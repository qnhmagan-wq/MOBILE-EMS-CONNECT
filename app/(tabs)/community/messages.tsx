import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useIncidents } from '@/src/hooks/useIncidents';
import UnreadBadge from '@/components/UnreadBadge';
import StatusBadge from '@/components/StatusBadge';
import { Incident } from '@/src/types/incident.types';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';

export default function MessagesScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { incidents, loadIncidents, isLoading } = useIncidents();
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    if (isFocused) {
      loadIncidents();
    }
  }, [isFocused]);

  useEffect(() => {
    // Filter to show only active incidents (pending, dispatched, in_progress)
    const filtered = incidents.filter((incident) =>
      ['pending', 'dispatched', 'in_progress'].includes(incident.status)
    );
    setActiveIncidents(filtered);
  }, [incidents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return 'medical';
      case 'fire':
        return 'flame';
      case 'accident':
        return 'car';
      case 'crime':
        return 'shield';
      case 'natural_disaster':
        return 'warning';
      default:
        return 'alert-circle';
    }
  };

  if (isLoading && incidents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get most recent incident for navigation
  const mostRecentIncident = activeIncidents.length > 0
    ? activeIncidents.reduce((prev, current) =>
        new Date(current.created_at) > new Date(prev.created_at) ? current : prev
      )
    : null;

  // Calculate total unread count (this would need proper implementation with actual unread counts)
  const hasActiveIncidents = activeIncidents.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Emergency support and assistance</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {!hasActiveIncidents ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No active conversations</Text>
            <Text style={styles.emptyText}>
              Messages will appear here when you have active emergencies
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.conversationCard}
            onPress={() => mostRecentIncident && router.push(`/(tabs)/community/chat?id=${mostRecentIncident.id}`)}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name="shield-checkmark"
                size={32}
                color={Colors.primary}
              />
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationTitle}>
                  Emergency Support Center
                </Text>
                <Text style={styles.conversationTime}>
                  {mostRecentIncident && formatDate(mostRecentIncident.created_at)}
                </Text>
              </View>

              <View style={styles.conversationFooter}>
                <Text style={styles.conversationPreview} numberOfLines={1}>
                  {activeIncidents.length === 1
                    ? `${activeIncidents[0].type.charAt(0).toUpperCase() + activeIncidents[0].type.slice(1)} emergency - ${activeIncidents[0].description}`
                    : `${activeIncidents.length} active emergencies`}
                </Text>
                {mostRecentIncident && (
                  <StatusBadge status={mostRecentIncident.status} size="small" />
                )}
              </View>

              <View style={styles.conversationMeta}>
                <Ionicons name="chatbubble-ellipses" size={14} color={Colors.textSecondary} />
                <Text style={styles.locationText}>
                  Tap to chat with responders and admin
                </Text>
              </View>
            </View>

            <View style={styles.badgeContainer}>
              {mostRecentIncident && <UnreadBadge incidentId={mostRecentIncident.id} size="medium" />}
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl * 2,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.circle,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  conversationTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  conversationTime: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  conversationPreview: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  badgeContainer: {
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
});
