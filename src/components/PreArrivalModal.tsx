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
import { submitMultiPatientPreArrival } from '@/src/services/dispatch.service';
import { PreArrivalData, PatientFormData } from '@/src/types/dispatch.types';
import { formatDateTime } from '@/src/utils/time';
import { scale, scaleFontSize, scaleSpacing, scaleHeight } from '@/src/utils/responsive';

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
  existingData?: PreArrivalData[] | null;
  onSuccess?: (patients: PreArrivalData[]) => void;
}

interface PatientFormCardProps {
  index: number;
  patient: PatientFormData;
  showCallerName: boolean;
  showRemove: boolean;
  onUpdate: (field: keyof PatientFormData, value: any) => void;
  onRemove: () => void;
  validationErrors: string[];
  incidentType?: string;
  isSubmitting: boolean;
}

const PatientFormCard: React.FC<PatientFormCardProps> = ({
  index,
  patient,
  showCallerName,
  showRemove,
  onUpdate,
  onRemove,
  validationErrors,
  incidentType,
  isSubmitting,
}) => {
  const [showIncidentTypePicker, setShowIncidentTypePicker] = useState(false);
  const [selectedEtaMinutes, setSelectedEtaMinutes] = useState<number | null>(null);

  const handleEtaSelect = (minutes: number) => {
    if (selectedEtaMinutes === minutes) {
      setSelectedEtaMinutes(null);
      onUpdate('estimated_arrival', null);
    } else {
      setSelectedEtaMinutes(minutes);
      const eta = new Date(Date.now() + minutes * 60 * 1000);
      onUpdate('estimated_arrival', eta.toISOString());
    }
  };

  const clearEta = () => {
    setSelectedEtaMinutes(null);
    onUpdate('estimated_arrival', null);
  };

  const handleIncidentTypeSelect = (type: string) => {
    onUpdate('incident_type', type);
    setShowIncidentTypePicker(false);
  };

  return (
    <View style={styles.patientCard}>
      {/* Header with patient number and remove button */}
      <View style={styles.patientCardHeader}>
        <Text style={styles.patientNumber}>Patient #{index + 1}</Text>
        {showRemove && (
          <TouchableOpacity onPress={onRemove} disabled={isSubmitting}>
            <Ionicons name="close-circle" size={scale(24)} color={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Validation errors banner */}
      {validationErrors.length > 0 && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={scale(16)} color={Colors.danger} />
          <View style={styles.errorList}>
            {validationErrors.map((error, i) => (
              <Text key={i} style={styles.errorText}>• {error}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Caller name - only on first patient */}
      {showCallerName && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Caller Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={patient.caller_name}
            onChangeText={(val) => onUpdate('caller_name', val)}
            placeholder="Enter caller name"
            placeholderTextColor={Colors.textLight}
            editable={!isSubmitting}
            autoCapitalize="words"
          />
        </View>
      )}

      {/* Patient name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Patient Name *</Text>
        <TextInput
          style={styles.input}
          value={patient.patient_name}
          onChangeText={(val) => onUpdate('patient_name', val)}
          placeholder="Enter patient name"
          placeholderTextColor={Colors.textLight}
          editable={!isSubmitting}
          autoCapitalize="words"
        />
      </View>

      {/* Sex and Age in a row */}
      <View style={styles.row}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <Text style={styles.label}>Sex *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={patient.sex}
              onValueChange={(val) => onUpdate('sex', val)}
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
            value={patient.age}
            onChangeText={(val) => onUpdate('age', val)}
            keyboardType="number-pad"
            placeholder="Age"
            placeholderTextColor={Colors.textLight}
            maxLength={3}
            editable={!isSubmitting}
          />
        </View>
      </View>

      {/* Incident type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Incident Type *</Text>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={() => setShowIncidentTypePicker(!showIncidentTypePicker)}
          disabled={isSubmitting}
        >
          <Text style={patient.incident_type ? styles.inputText : styles.placeholderText}>
            {patient.incident_type || 'Select or enter incident type'}
          </Text>
          <Ionicons
            name={showIncidentTypePicker ? "chevron-up" : "chevron-down"}
            size={scale(20)}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        {showIncidentTypePicker && (
          <View style={styles.suggestionsContainer}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {INCIDENT_TYPE_SUGGESTIONS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.suggestionItem,
                    patient.incident_type === type && styles.suggestionItemSelected
                  ]}
                  onPress={() => handleIncidentTypeSelect(type)}
                >
                  <Text style={[
                    styles.suggestionText,
                    patient.incident_type === type && styles.suggestionTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
              <TextInput
                style={styles.customInput}
                value={patient.incident_type}
                onChangeText={(val) => onUpdate('incident_type', val)}
                placeholder="Or type custom..."
                placeholderTextColor={Colors.textLight}
                editable={!isSubmitting}
              />
            </ScrollView>
          </View>
        )}
      </View>

      {/* ETA */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Estimated Arrival (Optional)</Text>
          {patient.estimated_arrival && (
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
        {patient.estimated_arrival && (
          <Text style={styles.etaDisplayText}>
            ETA: {formatDateTime(patient.estimated_arrival)}
          </Text>
        )}
      </View>
    </View>
  );
};

export const PreArrivalModal: React.FC<PreArrivalModalProps> = ({
  visible,
  onClose,
  dispatchId,
  incidentType,
  callerNameDefault,
  existingData,
  onSuccess,
}) => {
  // Main patient data
  const [patients, setPatients] = useState<PatientFormData[]>([{
    patient_name: '',
    sex: '',
    age: '',
    incident_type: '',
    caller_name: '',
    estimated_arrival: null,
  }]);

  // Validation errors per patient
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedPatients, setLastSubmittedPatients] = useState<PreArrivalData[]>([]);

  // Reset/populate form when modal opens
  useEffect(() => {
    if (visible) {
      if (existingData && existingData.length > 0) {
        // Load existing patients
        const loadedPatients: PatientFormData[] = existingData.map(data => ({
          patient_name: data.patient_name,
          sex: data.sex,
          age: data.age.toString(),
          incident_type: data.incident_type,
          caller_name: data.caller_name || '',
          estimated_arrival: data.estimated_arrival || null,
        }));

        setPatients(loadedPatients);
        setLastSubmittedPatients(existingData);
      } else {
        // New form - single patient
        setPatients([{
          patient_name: '',
          sex: '',
          age: '',
          incident_type: incidentType || '',
          caller_name: callerNameDefault || '',
          estimated_arrival: null,
        }]);
        setLastSubmittedPatients([]);
      }

      setValidationErrors({});
    }
  }, [visible, existingData, callerNameDefault, incidentType]);

  // Add new patient
  const addPatient = () => {
    if (patients.length >= 20) {
      Alert.alert('Limit Reached', 'You can add up to 20 patients per incident.');
      return;
    }

    setPatients([...patients, {
      patient_name: '',
      sex: '',
      age: '',
      incident_type: incidentType || '',
      caller_name: '',
      estimated_arrival: null,
    }]);
  };

  // Remove patient with confirmation
  const removePatient = (index: number) => {
    const patient = patients[index];
    const hasData = patient.patient_name || patient.age || patient.sex;

    if (hasData) {
      Alert.alert(
        'Remove Patient',
        'This patient form has data. Are you sure you want to remove it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => performRemove(index) }
        ]
      );
    } else {
      performRemove(index);
    }
  };

  const performRemove = (index: number) => {
    setPatients(patients.filter((_, i) => i !== index));

    // Re-index validation errors
    const newErrors = { ...validationErrors };
    delete newErrors[index];
    const reindexedErrors: Record<number, string[]> = {};
    Object.keys(newErrors).forEach(key => {
      const oldIndex = parseInt(key);
      const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
      reindexedErrors[newIndex] = newErrors[oldIndex];
    });
    setValidationErrors(reindexedErrors);
  };

  // Update specific patient field
  const updatePatient = (index: number, field: keyof PatientFormData, value: any) => {
    const newPatients = [...patients];
    newPatients[index] = { ...newPatients[index], [field]: value };
    setPatients(newPatients);

    // Clear validation errors for this patient
    if (validationErrors[index]) {
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  // Validate single patient
  const validatePatient = (patient: PatientFormData): string[] => {
    const errors: string[] = [];

    if (!patient.patient_name.trim()) errors.push('Patient name is required');
    if (!patient.sex) errors.push('Sex is required');
    if (!patient.age.trim()) {
      errors.push('Age is required');
    } else {
      const ageNum = parseInt(patient.age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        errors.push('Age must be between 0-150');
      }
    }
    if (!patient.incident_type.trim()) errors.push('Incident type is required');

    return errors;
  };

  // Validate all patients
  const validateAllPatients = (): boolean => {
    const errors: Record<number, string[]> = {};
    let hasErrors = false;

    patients.forEach((patient, index) => {
      const patientErrors = validatePatient(patient);
      if (patientErrors.length > 0) {
        errors[index] = patientErrors;
        hasErrors = true;
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async () => {
    // Validate all patients
    if (!validateAllPatients()) {
      const firstErrorIndex = Object.keys(validationErrors)[0];
      Alert.alert(
        'Validation Error',
        `Patient #${parseInt(firstErrorIndex) + 1} has errors:\n${validationErrors[parseInt(firstErrorIndex)].join('\n')}`
      );
      return;
    }

    // Show confirmation if resubmitting
    if (lastSubmittedPatients.length > 0) {
      Alert.alert(
        'Update Patient Information',
        `This will replace the ${lastSubmittedPatients.length} previously submitted patient record(s). Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => performSubmit() }
        ]
      );
    } else {
      performSubmit();
    }
  };

  const performSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Transform to API format
      const patientsPayload = patients.map((patient, index) => ({
        patient_name: patient.patient_name.trim(),
        sex: patient.sex as 'Male' | 'Female' | 'Other',
        age: parseInt(patient.age),
        incident_type: patient.incident_type.trim(),
        // Only include caller_name on first patient if provided
        ...(index === 0 && patient.caller_name?.trim() && {
          caller_name: patient.caller_name.trim()
        }),
        ...(patient.estimated_arrival && {
          estimated_arrival: patient.estimated_arrival
        }),
      }));

      const response = await submitMultiPatientPreArrival(dispatchId, patientsPayload);

      setLastSubmittedPatients(response.patients);

      Alert.alert(
        'Success',
        `${response.patient_count} patient${response.patient_count > 1 ? 's' : ''} submitted successfully`,
        [{
          text: 'OK',
          onPress: () => {
            onSuccess?.(response.patients);
            onClose();
          }
        }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        'Unable to submit pre-arrival information. Please try again.';
      const backendValidationErrors = error.response?.data?.errors;

      if (backendValidationErrors) {
        const formattedErrors = Object.entries(backendValidationErrors)
          .map(([key, msgs]) => `${key}: ${(msgs as string[]).join(', ')}`)
          .join('\n');
        Alert.alert('Validation Error', formattedErrors);
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
                  <Text style={styles.headerSubtitle}>
                    {patients.length} Patient{patients.length > 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close" size={scale(28)} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Submitted indicator */}
                {lastSubmittedPatients.length > 0 && (
                  <View style={styles.submittedIndicator}>
                    <Ionicons name="checkmark-circle" size={scale(20)} color={Colors.success} />
                    <Text style={styles.submittedText}>
                      Last submitted: {lastSubmittedPatients.length} patient{lastSubmittedPatients.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}

                {/* Scrollable form */}
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.infoText}>
                    Providing patient information helps medical teams prepare for your arrival.
                  </Text>

                  {/* Patient cards */}
                  {patients.map((patient, index) => (
                    <PatientFormCard
                      key={index}
                      index={index}
                      patient={patient}
                      showCallerName={index === 0}
                      showRemove={patients.length > 1}
                      onUpdate={(field, value) => updatePatient(index, field, value)}
                      onRemove={() => removePatient(index)}
                      validationErrors={validationErrors[index] || []}
                      incidentType={incidentType}
                      isSubmitting={isSubmitting}
                    />
                  ))}

                  {/* Add patient button */}
                  {patients.length < 20 && (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={addPatient}
                      disabled={isSubmitting}
                    >
                      <Ionicons name="add-circle" size={scale(24)} color={Colors.primary} />
                      <Text style={styles.addButtonText}>
                        Add Another Patient ({patients.length}/20)
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Submit button */}
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={Colors.textWhite} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={scale(24)} color={Colors.textWhite} />
                        <Text style={styles.submitButtonText}>
                          Submit {patients.length} Patient{patients.length > 1 ? 's' : ''}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Skip button */}
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
    paddingBottom: scaleSpacing(Spacing.xl),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    padding: scaleSpacing(Spacing.lg),
    paddingTop: scaleSpacing(Spacing.xl),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
  },
  headerTitle: {
    fontSize: scaleFontSize(FontSizes.lg),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingRight: scale(40),
  },
  headerSubtitle: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: scaleSpacing(Spacing.xs),
  },
  closeButton: {
    position: 'absolute',
    right: scaleSpacing(Spacing.lg),
    top: scaleSpacing(Spacing.xl),
    padding: scaleSpacing(Spacing.xs),
  },
  submittedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSpacing(Spacing.xs),
    paddingVertical: scaleSpacing(Spacing.sm),
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  submittedText: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.success,
    fontWeight: '500',
  },
  scrollView: {
    maxHeight: scaleHeight(550),
  },
  formContent: {
    padding: scaleSpacing(Spacing.lg),
    paddingBottom: scaleSpacing(Spacing.xxl || Spacing.xl * 2),
  },
  infoText: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.textSecondary,
    marginBottom: scaleSpacing(Spacing.lg),
    lineHeight: scale(20),
    textAlign: 'center',
  },

  // Patient card styles
  patientCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: scaleSpacing(Spacing.lg),
    marginBottom: scaleSpacing(Spacing.md),
  },
  patientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSpacing(Spacing.md),
    paddingBottom: scaleSpacing(Spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  patientNumber: {
    fontSize: scaleFontSize(FontSizes.lg),
    fontWeight: '700',
    color: Colors.primary,
  },

  // Error banner
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: BorderRadius.sm,
    padding: scaleSpacing(Spacing.sm),
    marginBottom: scaleSpacing(Spacing.md),
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleSpacing(Spacing.sm),
  },
  errorList: {
    flex: 1,
  },
  errorText: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.danger,
    lineHeight: scale(18),
  },

  // Form group styles
  formGroup: {
    marginBottom: scaleSpacing(Spacing.lg),
  },
  row: {
    flexDirection: 'row',
    gap: scaleSpacing(Spacing.md),
  },
  halfWidth: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSpacing(Spacing.sm),
  },
  label: {
    fontSize: scaleFontSize(FontSizes.md),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scaleSpacing(Spacing.sm),
  },
  clearText: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.primary,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: scaleSpacing(Spacing.md),
    fontSize: scaleFontSize(FontSizes.md),
    color: Colors.textPrimary,
    minHeight: scale(48),
  },
  inputButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: scaleSpacing(Spacing.md),
    minHeight: scale(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: scaleFontSize(FontSizes.md),
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    fontSize: scaleFontSize(FontSizes.md),
    color: Colors.textLight,
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    minHeight: scale(48),
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
    marginTop: scaleSpacing(Spacing.sm),
    maxHeight: scaleHeight(250),
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: scaleSpacing(Spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionItemSelected: {
    backgroundColor: Colors.primary + '20',
  },
  suggestionText: {
    fontSize: scaleFontSize(FontSizes.md),
    color: Colors.textPrimary,
  },
  suggestionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  customInput: {
    padding: scaleSpacing(Spacing.md),
    fontSize: scaleFontSize(FontSizes.md),
    color: Colors.textPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  etaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSpacing(Spacing.sm),
  },
  etaButton: {
    paddingVertical: scaleSpacing(Spacing.sm),
    paddingHorizontal: scaleSpacing(Spacing.md),
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
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  etaButtonTextSelected: {
    color: Colors.textWhite,
  },
  etaDisplayText: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.textSecondary,
    marginTop: scaleSpacing(Spacing.sm),
    fontStyle: 'italic',
  },

  // Add patient button
  addButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: scaleSpacing(Spacing.lg),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSpacing(Spacing.sm),
    marginBottom: scaleSpacing(Spacing.lg),
  },
  addButtonText: {
    fontSize: scaleFontSize(FontSizes.md),
    color: Colors.primary,
    fontWeight: '600',
  },

  // Submit and skip buttons
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: scaleSpacing(Spacing.lg),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSpacing(Spacing.sm),
    marginTop: scaleSpacing(Spacing.lg),
    minHeight: scale(52),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.textWhite,
    fontSize: scaleFontSize(FontSizes.md),
    fontWeight: '600',
  },
  skipButton: {
    padding: scaleSpacing(Spacing.md),
    alignItems: 'center',
    marginTop: scaleSpacing(Spacing.md),
  },
  skipButtonText: {
    color: Colors.textSecondary,
    fontSize: scaleFontSize(FontSizes.md),
    textDecorationLine: 'underline',
  },
});
