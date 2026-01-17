import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/config/theme";
import { useRouter } from "expo-router";

export default function CommunityProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/(tabs)/community/edit-profile');
  };

  const handleUserSettings = () => {
    Alert.alert("User Settings", "Opening settings...");
  };

  const handleAboutUs = () => {
    Alert.alert("About Us", "EMS Connect v1.0");
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
          {user?.phone_number && <Text style={styles.phone}>{user.phone_number}</Text>}

          {/* Medical Info */}
          <View style={styles.medicalInfo}>
            {user?.blood_type && (
              <View style={styles.infoItem}>
                <Ionicons name="water" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Blood Type: {user.blood_type}</Text>
              </View>
            )}
            {user?.allergies && (
              <View style={styles.infoItem}>
                <Ionicons name="warning" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Allergies: {user.allergies}</Text>
              </View>
            )}
            {user?.existing_conditions && (
              <View style={styles.infoItem}>
                <Ionicons name="fitness" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Existing Conditions: {user.existing_conditions}</Text>
              </View>
            )}
            {user?.medications && (
              <View style={styles.infoItem}>
                <Ionicons name="medkit" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Medications: {user.medications}</Text>
              </View>
            )}
            {!user?.blood_type && !user?.allergies && !user?.existing_conditions && !user?.medications && (
              <View style={styles.infoItem}>
                <Ionicons name="information-circle" size={18} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Tap Edit Profile to add your medical information</Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="create-outline" size={24} color={Colors.textPrimary} />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleUserSettings}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
            </View>
            <Text style={styles.menuText}>User Settings</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleAboutUs}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="information-circle-outline" size={24} color={Colors.textPrimary} />
            </View>
            <Text style={styles.menuText}>About Us</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="log-out-outline" size={24} color={Colors.textPrimary} />
            </View>
            <Text style={styles.menuText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: "row",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  medicalInfo: {
    width: "100%",
    marginTop: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  menuContainer: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
});
