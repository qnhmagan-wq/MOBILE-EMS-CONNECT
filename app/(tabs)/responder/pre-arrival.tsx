import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";

export default function PreArrivalFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.id ? parseInt(params.id as string) : null;
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    callerName: "",
    patientName: "",
    sex: "",
    age: "",
    typeOfIncident: "",
    estimatedTimeOfArrival: "",
  });

  const handleSubmit = () => {
    // Validate form
    if (!formData.callerName || !formData.patientName || !formData.sex || !formData.age) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // TODO: Submit to backend
    Alert.alert("Success", "Pre-arrival information submitted", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="medical" size={32} color={Colors.textWhite} />
          </View>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>WELCOME, {user?.name?.toUpperCase() || 'RESPONDER'}</Text>
            <TouchableOpacity style={[styles.statusButton, styles.statusButtonActive]}>
              <Text style={styles.statusButtonText}>Available</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color={Colors.textWhite} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Pre Arrival Information Form Mo...</Text>
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContent}>
        <Text style={styles.formTitle}>Patient Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Caller Name:</Text>
          <TextInput
            style={styles.input}
            value={formData.callerName}
            onChangeText={(text) => setFormData({ ...formData, callerName: text })}
            placeholder="Enter caller name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Patient Name:</Text>
          <TextInput
            style={styles.input}
            value={formData.patientName}
            onChangeText={(text) => setFormData({ ...formData, patientName: text })}
            placeholder="Enter patient name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Sex:</Text>
            <TextInput
              style={styles.input}
              value={formData.sex}
              onChangeText={(text) => setFormData({ ...formData, sex: text })}
              placeholder="M/F"
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Age:</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="Enter age"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Type of Incident:</Text>
          <TextInput
            style={styles.input}
            value={formData.typeOfIncident}
            onChangeText={(text) => setFormData({ ...formData, typeOfIncident: text })}
            placeholder="Enter incident type"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Estimated Time of Arrival:</Text>
          <TextInput
            style={styles.input}
            value={formData.estimatedTimeOfArrival}
            onChangeText={(text) => setFormData({ ...formData, estimatedTimeOfArrival: text })}
            placeholder="e.g., 10 minutes"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Red Section */}
      <View style={styles.bottomSection} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerBanner: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.textWhite,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textWhite,
    marginBottom: Spacing.xs,
  },
  statusButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusButtonActive: {
    backgroundColor: "#10B981",
  },
  statusButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.textWhite,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  titleContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  screenTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.lg,
    backgroundColor: Colors.textWhite,
  },
  formTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    fontFamily: "serif",
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: "#8B5A3C",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textWhite,
    minHeight: 48,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
    alignSelf: "flex-end",
    minWidth: 120,
  },
  submitButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  bottomSection: {
    height: 100,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
});


