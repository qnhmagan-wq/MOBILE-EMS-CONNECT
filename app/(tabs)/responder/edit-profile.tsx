import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius } from "@/src/config/theme";
import { useRouter } from "expo-router";
import { updateProfile, getProfile } from "@/src/services/user.service";

export default function ResponderEditProfileScreen() {
  const { user, restoreAuth } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [badgeNumber, setBadgeNumber] = useState(user?.badge_number || "");
  const [hospitalAssigned, setHospitalAssigned] = useState(user?.hospital_assigned || "");

  // Load current profile data from API (if available)
  // Falls back to AuthContext data if API fails or returns empty values
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        // Only update if API returns non-empty values, otherwise keep AuthContext values
        if (profile.first_name) setFirstName(profile.first_name);
        if (profile.last_name) setLastName(profile.last_name);
        if (profile.phone_number) setPhoneNumber(profile.phone_number);
        if (profile.badge_number) setBadgeNumber(profile.badge_number);
        if (profile.hospital_assigned) setHospitalAssigned(profile.hospital_assigned);
      } catch (error) {
        // API failed - keep using AuthContext data (already set as initial values)
        console.log("[Edit Profile] Using local user data - API unavailable");
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Validation Error", "First name and Last name are required.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone_number: phoneNumber.trim() || undefined,
        badge_number: badgeNumber.trim() || undefined,
        hospital_assigned: hospitalAssigned.trim() || undefined,
      });

      // Refresh auth context with updated user data
      await restoreAuth();

      Alert.alert("Success", "Profile updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("[Edit Profile] Save error:", error);
      // Handle validation errors (422)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join('\n');
        Alert.alert("Validation Error", errorMessages);
      } else {
        const errorMessage =
          error.response?.data?.message || "Failed to save profile. Please try again.";
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Email (Read-only) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.readOnlyInput}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.readOnlyText}>{user?.email}</Text>
          </View>
          <Text style={styles.helperText}>Email cannot be changed</Text>
        </View>

        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter First name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter Last Name"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Badge/ID Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Badge/ID Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="id-card-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={badgeNumber}
              onChangeText={setBadgeNumber}
              placeholder="Enter badge or ID number"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        {/* Hospital Assigned */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hospital Assigned</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={hospitalAssigned}
              onChangeText={setHospitalAssigned}
              placeholder="Enter assigned hospital"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  readOnlyInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readOnlyText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
