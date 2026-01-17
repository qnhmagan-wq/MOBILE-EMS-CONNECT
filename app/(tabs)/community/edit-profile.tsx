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

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function CommunityEditProfileScreen() {
  const { user, restoreAuth } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [bloodType, setBloodType] = useState(user?.blood_type || "");
  const [allergies, setAllergies] = useState(user?.allergies || "");
  const [existingConditions, setExistingConditions] = useState(user?.existing_conditions || "");
  const [medications, setMedications] = useState(user?.medications || "");

  const [showBloodTypePicker, setShowBloodTypePicker] = useState(false);

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
        if (profile.blood_type) setBloodType(profile.blood_type);
        if (profile.allergies) setAllergies(profile.allergies);
        if (profile.existing_conditions) setExistingConditions(profile.existing_conditions);
        if (profile.medications) setMedications(profile.medications);
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
      Alert.alert("Validation Error", "First name and last name are required.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone_number: phoneNumber.trim() || undefined,
        blood_type: bloodType || undefined,
        allergies: allergies.trim() || undefined,
        existing_conditions: existingConditions.trim() || undefined,
        medications: medications.trim() || undefined,
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
              placeholder="Enter first name"
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
              placeholder="Enter last name"
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

        {/* Medical Information Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="medkit" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Medical Information</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          This information helps responders provide better care in emergencies
        </Text>

        {/* Blood Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Type</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowBloodTypePicker(!showBloodTypePicker)}
          >
            <Ionicons name="water-outline" size={20} color={Colors.textSecondary} />
            <Text style={[styles.input, !bloodType && styles.placeholderText]}>
              {bloodType || "Select blood type"}
            </Text>
            <Ionicons
              name={showBloodTypePicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
          {showBloodTypePicker && (
            <View style={styles.pickerContainer}>
              {BLOOD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerItem,
                    bloodType === type && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setBloodType(type);
                    setShowBloodTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      bloodType === type && styles.pickerItemTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setBloodType("");
                  setShowBloodTypePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Allergies */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Allergies</Text>
          <View style={styles.textAreaContainer}>
            <Ionicons name="warning-outline" size={20} color={Colors.textSecondary} style={styles.textAreaIcon} />
            <TextInput
              style={styles.textArea}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="List any allergies (e.g., Penicillin, Peanuts)"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Existing Conditions */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Existing Conditions</Text>
          <View style={styles.textAreaContainer}>
            <Ionicons name="fitness-outline" size={20} color={Colors.textSecondary} style={styles.textAreaIcon} />
            <TextInput
              style={styles.textArea}
              value={existingConditions}
              onChangeText={setExistingConditions}
              placeholder="List any medical conditions (e.g., Asthma, Diabetes)"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Medications */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Medications</Text>
          <View style={styles.textAreaContainer}>
            <Ionicons name="medkit-outline" size={20} color={Colors.textSecondary} style={styles.textAreaIcon} />
            <TextInput
              style={styles.textArea}
              value={medications}
              onChangeText={setMedications}
              placeholder="List current medications (e.g., Aspirin 81mg daily)"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
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
  placeholderText: {
    color: Colors.textLight,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary + "15",
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  pickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: "600",
  },
  textAreaContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 80,
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
