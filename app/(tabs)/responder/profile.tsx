import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import * as incidentService from "@/src/services/incident.service";
import { Incident } from "@/src/types/incident.types";

export default function ResponderProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [completedResponses, setCompletedResponses] = useState<Incident[]>([]);

  useEffect(() => {
    loadCompletedResponses();
  }, []);

  const loadCompletedResponses = async () => {
    try {
      const incidents = await incidentService.getIncidents();
      // Filter only completed incidents
      const completed = incidents.filter(inc => inc.status === 'completed');
      setCompletedResponses(completed.slice(0, 10)); // Show last 10
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* User Info Section - Dark Red */}
        <View style={styles.userInfoSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={Colors.primary} />
            </View>
          </View>
          
          <View style={styles.userInfoBanner}>
            <Text style={styles.roleText}>ADMIN</Text>
            <Text style={styles.name}>{user?.name || 'Responder'}</Text>
          </View>
        </View>

        {/* Menu Section - White */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-add" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="settings" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.menuText}>User Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="log-out" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.menuText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Responses Section - Dark Red */}
        <View style={styles.responsesSection}>
          <Text style={styles.responsesTitle}>My Complete Responses:</Text>
          
          {completedResponses.length === 0 ? (
            <View style={styles.emptyResponses}>
              <Text style={styles.emptyText}>No completed responses yet</Text>
            </View>
          ) : (
            <View style={styles.responsesGrid}>
              {completedResponses.map((response) => (
                <View key={response.id} style={styles.responseCard}>
                  <View style={styles.responseImagePlaceholder}>
                    <Ionicons name="image" size={32} color="rgba(255,255,255,0.5)" />
                  </View>
                  <Text style={styles.responseAddress}>Address:</Text>
                  <Text style={styles.responseDate}>date: {formatDate(response.created_at)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: Colors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  userInfoSection: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F4FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.textWhite,
  },
  userInfoBanner: {
    backgroundColor: Colors.textWhite,
    width: "100%",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  roleText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  name: {
    fontSize: FontSizes.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  menuSection: {
    backgroundColor: Colors.textWhite,
    paddingVertical: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  responsesSection: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    minHeight: 300,
  },
  responsesTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textWhite,
    marginBottom: Spacing.lg,
  },
  emptyResponses: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: "rgba(255,255,255,0.7)",
  },
  responsesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  responseCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  responseImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  responseAddress: {
    fontSize: FontSizes.xs,
    color: Colors.textWhite,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  responseDate: {
    fontSize: FontSizes.xs,
    color: Colors.textWhite,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
});
