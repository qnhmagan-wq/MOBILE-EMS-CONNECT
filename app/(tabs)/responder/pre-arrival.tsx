import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { Incident } from "@/src/types/incident.types";
import { Dispatch } from "@/src/types/dispatch.types";
import * as incidentService from "@/src/services/incident.service";
import { Picker } from '@react-native-picker/picker';

export default function PreArrivalFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.id ? parseInt(params.id as string) : null;
  const dispatchId = params.dispatchId ? parseInt(params.dispatchId as string) : null;
  const { user } = useAuth();
  const { dispatches } = useDispatch();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [callerName, setCallerName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    loadData();
  }, [incidentId, dispatchId]);

  const loadData = async () => {
    if (!incidentId) {
      setIsLoading(false);
      return;
    }

    try {
      const fetchedIncident = await incidentService.getIncident(incidentId);
      setIncident(fetchedIncident);

      // Find dispatch from context
      if (dispatchId) {
        const foundDispatch = dispatches.find(d => d.id === dispatchId);
        if (foundDispatch) {
          setDispatch(foundDispatch);
          // Pre-populate caller name from reporter if available
          if (foundDispatch.incident?.reporter?.name) {
            setCallerName(foundDispatch.incident.reporter.name);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      Alert.alert("Error", "Failed to load incident details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!callerName || !patientName || !sex || !age) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!dispatchId) {
      Alert.alert("Error", "No dispatch ID available");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement backend API call
      // await dispatchService.submitPreArrival(dispatchId, {
      //   caller_name: callerName,
      //   patient_name: patientName,
      //   sex: sex,
      //   age: parseInt(age),
      //   notes: additionalNotes
      // });

      Alert.alert(
        "Success",
        "Pre-arrival information submitted successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Failed to submit pre-arrival data:", error);
      Alert.alert("Error", "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Pre-Arrival Information</Text>
          {dispatch && (
            <Text style={styles.headerSubtitle}>
              Dispatch #{dispatch.id} • {incident?.type || 'Unknown'}
            </Text>
          )}
        </View>
      </View>

      {/* Incident Context Card */}
      {incident && (
        <View style={styles.contextCard}>
          <View style={styles.contextRow}>
            <Ionicons name="location" size={16} color={Colors.textSecondary} />
            <Text style={styles.contextText} numberOfLines={1}>{incident.address}</Text>
          </View>
          {dispatch && (
            <View style={styles.contextRow}>
              <Ionicons name="time" size={16} color={Colors.textSecondary} />
              <Text style={styles.contextText}>
                {dispatch.distance_text} • {dispatch.duration_text || 'Calculating...'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Form */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.formContent}>
        <Text style={styles.sectionTitle}>Patient Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Caller Name</Text>
          <TextInput
            style={styles.input}
            value={callerName}
            onChangeText={setCallerName}
            placeholder={dispatch?.incident?.reporter?.name || "Enter caller name"}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Patient Name</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter patient name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Sex</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={sex}
                onValueChange={setSex}
                style={styles.picker}
                dropdownIconColor={Colors.textWhite}
              >
                <Picker.Item label="Select..." value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
                <Picker.Item label="Unknown" value="unknown" />
              </Picker>
            </View>
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="Enter age"
              placeholderTextColor="#999"
              maxLength={3}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Any additional information..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Information</Text>
          )}
        </TouchableOpacity>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "bold",
    color: Colors.textWhite,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  contextCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  contextText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    minHeight: 48,
  },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  picker: {
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.lg,
    minHeight: 52,
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
});


