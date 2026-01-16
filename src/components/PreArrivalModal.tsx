import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';
import { submitPreArrival } from '@/src/services/dispatch.service';
import { PreArrivalData } from '@/src/types/dispatch.types';
import { formatDateTime } from '@/src/utils/time';

// Incident type suggestions for quick selection
const INCIDENT_TYPE_SUGGESTIONS = [
  'Cardiac Arrest',
  'Stroke',
  'Trauma',
  'Respiratory Distress',
  'Allergic Reaction',
  'Diabetic Emergency',
  'Seizure',
  'Burns',
  'Poisoning',
  'Other Medical',
];

// Quick ETA options (in minutes from now)
const ETA_OPTIONS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20 min', minutes: 20 },
  { label: '30 min', minutes: 30 },
];

interface PreArrivalModalProps {
  visible: boolean;
  onClose: () => void;
  dispatchId: number;
  incidentType?: string;
  callerNameDefault?: string;
  existingData?: PreArrivalData | null;
  onSuccess?: () => void;
}

export const PreArrivalModal: React.FC<PreArrivalModalProps> = ({
  visible,
  onClose,
  dispatchId,
  incidentType,
  callerNameDefault,
  existingData,
  onSuccess,
}) => {
  // Form state
  const [callerName, setCallerName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [sex, setSex] = useState<'' | 'Male' | 'Female' | 'Other'>('');
  const [age, setAge] = useState('');
  const [selectedIncidentType, setSelectedIncidentType] = useState('');
  const [showIncidentTypePicker, setShowIncidentTypePicker] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);
  const [selectedEtaMinutes, setSelectedEtaMinutes] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);

  // Reset/populate form when modal opens
  useEffect(() => {
    if (visible) {
      if (existingData) {
        // Populate with existing data for editing
        setCallerName(existingData.caller_name || '');
        setPatientName(existingData.patient_name);
        setSex(existingData.sex);
        setAge(existingData.age.toString());
        setSelectedIncidentType(existingData.incident_type);
        setEstimatedArrival(existingData.estimated_arrival || null);
        setLastSubmittedAt(existingData.submitted_at);
        setSelectedEtaMinutes(null);
      } else {
        // Reset to defaults for new form
        setCallerName(callerNameDefault || '');
        setPatientName('');
        setSex('');
        setAge('');
        setSelectedIncidentType(incidentType || '');
        setEstimatedArrival(null);
        setSelectedEtaMinutes(null);
        setLastSubmittedAt(null);
      }
    }
  }, [visible, existingData, callerNameDefault, incidentType]);

  const handleEtaSelect = (minutes: number) => {
    if (selectedEtaMinutes === minutes) {
      // Deselect if already selected
      setSelectedEtaMinutes(null);
      setEstimatedArrival(null);
    } else {
      setSelectedEtaMinutes(minutes);
      const eta = new Date(Date.now() + minutes * 60 * 1000);
      setEstimatedArrival(eta.toISOString());
    }
  };

  const clearEta = () => {
    setSelectedEtaMinutes(null);
    setEstimatedArrival(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!patientName.trim()) {
      Alert.alert('Required Field', 'Please enter the patient name');
      return;
    }
    if (!sex) {
      Alert.alert('Required Field', 'Please select the patient sex');
      return;
    }
    if (!age.trim()) {
      Alert.alert('Required Field', 'Please enter the patient age');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      Alert.alert('Invalid Age', 'Please enter a valid age (0-150)');
      return;
    }

    if (!selectedIncidentType.trim()) {
      Alert.alert('Required Field', 'Please select or enter the incident type');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPreArrival(dispatchId, {
        patient_name: patientName.trim(),
        sex: sex as 'Male' | 'Female' | 'Other',
        age: ageNum,
        incident_type: selectedIncidentType.trim(),
        caller_name: callerName.trim() || undefined,
        estimated_arrival: estimatedArrival || undefined,
      });

      // Update local state with submission timestamp
      if (response.pre_arrival?.submitted_at) {
        setLastSubmittedAt(response.pre_arrival.submitted_at);
      }

      Alert.alert(
        'Success',
        existingData ? 'Pre-arrival information updated successfully' : 'Pre-arrival information submitted successfully',
        [{ text: 'OK', onPress: () => {
          onSuccess?.();
          onClose();
        }}]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Unable to submit pre-arrival information. Please try again.';
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        // Format validation errors
        const errorList = Object.values(validationErrors).flat().join('\n');
        Alert.alert('Validation Error', errorList);
      } else {
        Alert.alert('Submission Failed', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleIncidentTypeSelect = (type: string) => {
    setSelectedIncidentType(type);
    setShowIncidentTypePicker(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Pre-Arrival Patient Information</Text>
                  <Text style={styles.headerSubtitle}>(Optional)</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close" size={28} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Last Submitted Indicator */}
                {lastSubmittedAt && (
                  <View style={styles.submittedIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.submittedText}>
                      Last submitted: {formatDateTime(lastSubmittedAt)}
                    </Text>
                  </View>
                )}

                {/* Form Content */}
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.infoText}>
                    Providing patient information helps medical teams prepare before your arrival.
                  </Text>

                  {/* Patient Name */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Patient Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={patientName}
                      onChangeText={setPatientName}
                      placeholder="Enter patient name"
                      placeholderTextColor={Colors.textLight}
                      editable={!isSubmitting}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* Sex and Age Row */}
                  <View style={styles.row}>
                    <View style={[styles.formGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Sex *</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={sex}
                          onValueChange={(value) => setSex(value as '' | 'Male' | 'Female' | 'Other')}
                          enabled={!isSubmitting}
                          style={styles.picker}
                        >
                          <Picker.Item label="Select..." value="" />
                          <Picker.Item label="Male" value="Male" />
                          <Picker.Item label="Female" value="Female" />
                          <Picker.Item label="Other" value="Other" />
                        </Picker>
                      </View>
                    </View>

                    <View style={[styles.formGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Age *</Text>
                      <TextInput
                        style={styles.input}
                        value={age}
                        onChangeText={setAge}
                        keyboardType="number-pad"
                        placeholder="Age"
                        placeholderTextColor={Colors.textLight}
                        maxLength={3}
                        editable={!isSubmitting}
                      />
                    </View>
                  </View>

                  {/* Incident Type */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Incident Type *</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowIncidentTypePicker(!showIncidentTypePicker)}
                      disabled={isSubmitting}
                    >
                      <Text style={selectedIncidentType ? styles.inputText : styles.placeholderText}>
                        {selectedIncidentType || 'Select or enter incident type'}
                      </Text>
                      <Ionicons
                        name={showIncidentTypePicker ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {showIncidentTypePicker && (
                      <View style={styles.suggestionsContainer}>
                        {INCIDENT_TYPE_SUGGESTIONS.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.suggestionItem,
                              selectedIncidentType === type && styles.suggestionItemSelected
                            ]}
                            onPress={() => handleIncidentTypeSelect(type)}
                          >
                            <Text style={[
                              styles.suggestionText,
                              selectedIncidentType === type && styles.suggestionTextSelected
                            ]}>
                              {type}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TextInput
                          style={styles.customInput}
                          value={selectedIncidentType}
                          onChangeText={setSelectedIncidentType}
                          placeholder="Or type custom..."
                          placeholderTextColor={Colors.textLight}
                          editable={!isSubmitting}
                        />
                      </View>
                    )}
                  </View>

                  {/* Caller Name (Optional) */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Caller Name (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={callerName}
                      onChangeText={setCallerName}
                      placeholder="Enter caller name"
                      placeholderTextColor={Colors.textLight}
                      editable={!isSubmitting}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* Estimated Arrival Time (Optional) */}
                  <View style={styles.formGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Estimated Arrival (Optional)</Text>
                      {estimatedArrival && (
                        <TouchableOpacity onPress={clearEta} disabled={isSubmitting}>
                          <Text style={styles.clearText}>Clear</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.etaContainer}>
                      {ETA_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.minutes}
                          style={[
                            styles.etaButton,
                            selectedEtaMinutes === option.minutes && styles.etaButtonSelected
                          ]}
                          onPress={() => handleEtaSelect(option.minutes)}
                          disabled={isSubmitting}
                        >
                          <Text style={[
                            styles.etaButtonText,
                            selectedEtaMinutes === option.minutes && styles.etaButtonTextSelected
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {estimatedArrival && (
                      <Text style={styles.etaDisplayText}>
                        ETA: {formatDateTime(estimatedArrival)}
                      </Text>
                    )}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={Colors.textWhite} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.textWhite} />
                        <Text style={styles.submitButtonText}>
                          {existingData ? 'Update Information' : 'Submit Information'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Skip Button */}
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.skipButtonText}>Skip for Now</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingRight: 40,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
    paddingRight: 40,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.xl,
    padding: Spacing.xs,
  },
  submittedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  submittedText: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    fontWeight: '500',
  },
  scrollView: {
    maxHeight: 550,
  },
  formContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  infoText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  clearText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
  },
  picker: {
    color: Colors.textPrimary,
  },
  suggestionsContainer: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    maxHeight: 250,
  },
  suggestionItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionItemSelected: {
    backgroundColor: Colors.primary + '20',
  },
  suggestionText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  suggestionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  customInput: {
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  etaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  etaButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  etaButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  etaButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  etaButtonTextSelected: {
    color: Colors.textWhite,
  },
  etaDisplayText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  skipButton: {
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  skipButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textDecorationLine: 'underline',
  },
});
