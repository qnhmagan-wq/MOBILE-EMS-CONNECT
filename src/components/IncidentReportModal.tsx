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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';
import { submitIncidentReport } from '@/src/services/dispatch.service';
import {
  IncidentReport,
  IncidentValidity,
  SeverityAssessment,
} from '@/src/types/dispatch.types';
import { scale, scaleFontSize, scaleSpacing, scaleHeight } from '@/src/utils/responsive';

const VALIDITY_OPTIONS: { value: IncidentValidity; label: string; color: string }[] = [
  { value: 'legitimate', label: 'Legitimate', color: '#10B981' },
  { value: 'false_alarm', label: 'False Alarm', color: '#EF4444' },
  { value: 'exaggerated', label: 'Exaggerated', color: '#F59E0B' },
  { value: 'uncertain', label: 'Uncertain', color: '#6B7280' },
];

const SEVERITY_OPTIONS: { value: SeverityAssessment; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#EF4444' },
  { value: 'serious', label: 'Serious', color: '#F97316' },
  { value: 'moderate', label: 'Moderate', color: '#F59E0B' },
  { value: 'minor', label: 'Minor', color: '#3B82F6' },
  { value: 'non_emergency', label: 'Non-Emergency', color: '#6B7280' },
];

interface IncidentReportModalProps {
  visible: boolean;
  onClose: () => void;
  dispatchId: number;
  existingReport?: IncidentReport | null;
  onSuccess?: (report: IncidentReport) => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  visible,
  onClose,
  dispatchId,
  existingReport,
  onSuccess,
}) => {
  const [incidentValidity, setIncidentValidity] = useState<IncidentValidity | null>(null);
  const [severityAssessment, setSeverityAssessment] = useState<SeverityAssessment | null>(null);
  const [sceneDescription, setSceneDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [additionalResourcesNeeded, setAdditionalResourcesNeeded] = useState(false);
  const [additionalResourcesDetails, setAdditionalResourcesDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset/populate form when modal opens
  useEffect(() => {
    if (visible) {
      if (existingReport) {
        setIncidentValidity(existingReport.incident_validity);
        setSeverityAssessment(existingReport.severity_assessment);
        setSceneDescription(existingReport.scene_description || '');
        setRemarks(existingReport.remarks || '');
        setAdditionalResourcesNeeded(existingReport.additional_resources_needed);
        setAdditionalResourcesDetails(existingReport.additional_resources_details || '');
      } else {
        setIncidentValidity(null);
        setSeverityAssessment(null);
        setSceneDescription('');
        setRemarks('');
        setAdditionalResourcesNeeded(false);
        setAdditionalResourcesDetails('');
      }
      setValidationError(null);
    }
  }, [visible, existingReport]);

  const handleSubmit = async () => {
    // Validate required field
    if (!incidentValidity) {
      setValidationError('Please select an incident validity assessment.');
      return;
    }
    setValidationError(null);

    // Confirmation if updating existing report
    if (existingReport) {
      Alert.alert(
        'Update Report',
        'This will update your previous incident report. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update', onPress: performSubmit },
        ]
      );
    } else {
      performSubmit();
    }
  };

  const performSubmit = async () => {
    if (!incidentValidity) return;

    setIsSubmitting(true);
    try {
      const response = await submitIncidentReport(dispatchId, {
        incident_validity: incidentValidity,
        severity_assessment: severityAssessment,
        scene_description: sceneDescription.trim() || null,
        remarks: remarks.trim() || null,
        additional_resources_needed: additionalResourcesNeeded,
        additional_resources_details: additionalResourcesNeeded
          ? (additionalResourcesDetails.trim() || null)
          : null,
      });

      Alert.alert(
        'Success',
        'Incident report submitted successfully.',
        [{
          text: 'OK',
          onPress: () => {
            onSuccess?.(response.report);
            onClose();
          },
        }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        'Unable to submit incident report. Please try again.';
      const backendErrors = error.response?.data?.errors;

      if (backendErrors) {
        const formatted = Object.entries(backendErrors)
          .map(([key, msgs]) => `${key}: ${(msgs as string[]).join(', ')}`)
          .join('\n');
        Alert.alert('Validation Error', formatted);
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
                  <View style={styles.headerIcon}>
                    <Ionicons name="document-text" size={scale(24)} color={Colors.primary} />
                  </View>
                  <Text style={styles.headerTitle}>
                    {existingReport ? 'Edit Incident Report' : 'Incident Report'}
                  </Text>
                  <Text style={styles.headerSubtitle}>On-Scene Assessment</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close" size={scale(28)} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Submitted indicator */}
                {existingReport && (
                  <View style={styles.submittedIndicator}>
                    <Ionicons name="checkmark-circle" size={scale(18)} color={Colors.success} />
                    <Text style={styles.submittedText}>
                      Previously submitted — editing will update the report
                    </Text>
                  </View>
                )}

                {/* Scrollable form */}
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                >
                  {/* Validation error */}
                  {validationError && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="warning" size={scale(18)} color="#EF4444" />
                      <Text style={styles.errorText}>{validationError}</Text>
                    </View>
                  )}

                  {/* Incident Validity (Required) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Incident Validity <Text style={styles.required}>*</Text>
                    </Text>
                    <Text style={styles.fieldHint}>Was this a real emergency?</Text>
                    <View style={styles.optionsGrid}>
                      {VALIDITY_OPTIONS.map((option) => {
                        const isSelected = incidentValidity === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.optionCard,
                              isSelected && { borderColor: option.color, backgroundColor: option.color + '15' },
                            ]}
                            onPress={() => {
                              setIncidentValidity(option.value);
                              setValidationError(null);
                            }}
                            disabled={isSubmitting}
                          >
                            <View style={[styles.optionDot, { backgroundColor: isSelected ? option.color : '#D1D5DB' }]} />
                            <Text style={[
                              styles.optionLabel,
                              isSelected && { color: option.color, fontWeight: '700' },
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Severity Assessment (Optional) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Severity Assessment</Text>
                    <Text style={styles.fieldHint}>How severe is the situation?</Text>
                    <View style={styles.severityRow}>
                      {SEVERITY_OPTIONS.map((option) => {
                        const isSelected = severityAssessment === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.severityChip,
                              isSelected && { backgroundColor: option.color, borderColor: option.color },
                            ]}
                            onPress={() => setSeverityAssessment(
                              isSelected ? null : option.value
                            )}
                            disabled={isSubmitting}
                          >
                            <Text style={[
                              styles.severityChipText,
                              isSelected && { color: '#FFFFFF' },
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Scene Description (Optional) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Scene Description</Text>
                    <TextInput
                      style={styles.textArea}
                      value={sceneDescription}
                      onChangeText={setSceneDescription}
                      placeholder="Describe what you found at the scene..."
                      placeholderTextColor={Colors.textLight}
                      multiline
                      numberOfLines={3}
                      maxLength={2000}
                      editable={!isSubmitting}
                      textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{sceneDescription.length}/2000</Text>
                  </View>

                  {/* Remarks (Optional) */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Remarks</Text>
                    <TextInput
                      style={styles.textArea}
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Additional remarks or feedback for admin..."
                      placeholderTextColor={Colors.textLight}
                      multiline
                      numberOfLines={3}
                      maxLength={2000}
                      editable={!isSubmitting}
                      textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{remarks.length}/2000</Text>
                  </View>

                  {/* Additional Resources Toggle */}
                  <View style={styles.fieldGroup}>
                    <View style={styles.toggleRow}>
                      <View style={styles.toggleLabelContainer}>
                        <Text style={styles.fieldLabel}>Additional Resources Needed</Text>
                        <Text style={styles.fieldHint}>Do you need backup or extra support?</Text>
                      </View>
                      <Switch
                        value={additionalResourcesNeeded}
                        onValueChange={setAdditionalResourcesNeeded}
                        disabled={isSubmitting}
                        trackColor={{ false: '#D1D5DB', true: Colors.primary + '80' }}
                        thumbColor={additionalResourcesNeeded ? Colors.primary : '#F3F4F6'}
                      />
                    </View>

                    {/* Conditional details field */}
                    {additionalResourcesNeeded && (
                      <TextInput
                        style={[styles.textInput, { marginTop: scaleSpacing(Spacing.sm) }]}
                        value={additionalResourcesDetails}
                        onChangeText={setAdditionalResourcesDetails}
                        placeholder="What additional resources are needed?"
                        placeholderTextColor={Colors.textLight}
                        maxLength={1000}
                        editable={!isSubmitting}
                      />
                    )}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, (!incidentValidity || isSubmitting) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!incidentValidity || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="send" size={scale(20)} color="#fff" />
                        <Text style={styles.submitButtonText}>
                          {existingReport ? 'Update Report' : 'Submit Report'}
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
                    <Text style={styles.skipButtonText}>Submit Later</Text>
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
    alignItems: 'center',
    position: 'relative',
  },
  headerIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSpacing(Spacing.sm),
  },
  headerTitle: {
    fontSize: scaleFontSize(FontSizes.lg),
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: scaleSpacing(2),
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
    fontSize: scaleFontSize(FontSizes.xs),
    color: Colors.success,
    fontWeight: '500',
  },
  scrollView: {
    maxHeight: scaleHeight(550),
  },
  formContent: {
    padding: scaleSpacing(Spacing.lg),
    paddingBottom: scaleSpacing(Spacing.xl * 2),
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(Spacing.sm),
    backgroundColor: '#FEF2F2',
    padding: scaleSpacing(Spacing.md),
    borderRadius: BorderRadius.sm,
    marginBottom: scaleSpacing(Spacing.md),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: '#EF4444',
    flex: 1,
  },

  // Field groups
  fieldGroup: {
    marginBottom: scaleSpacing(Spacing.lg),
  },
  fieldLabel: {
    fontSize: scaleFontSize(FontSizes.md),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: scaleSpacing(2),
  },
  fieldHint: {
    fontSize: scaleFontSize(FontSizes.xs),
    color: Colors.textSecondary,
    marginBottom: scaleSpacing(Spacing.sm),
  },
  required: {
    color: '#EF4444',
  },

  // Validity options (2x2 grid)
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSpacing(Spacing.sm),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSpacing(Spacing.sm),
    width: '48%',
    paddingVertical: scaleSpacing(Spacing.md),
    paddingHorizontal: scaleSpacing(Spacing.md),
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
  },
  optionLabel: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.textPrimary,
    fontWeight: '500',
    flexShrink: 1,
  },

  // Severity chips (horizontal scroll)
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleSpacing(Spacing.xs),
  },
  severityChip: {
    paddingVertical: scaleSpacing(Spacing.xs + 2),
    paddingHorizontal: scaleSpacing(Spacing.md),
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  severityChipText: {
    fontSize: scaleFontSize(FontSizes.xs),
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Text inputs
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: scaleSpacing(Spacing.md),
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.textPrimary,
    minHeight: scaleHeight(80),
    backgroundColor: '#F9FAFB',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: scaleSpacing(Spacing.md),
    fontSize: scaleFontSize(FontSizes.sm),
    color: Colors.textPrimary,
    backgroundColor: '#F9FAFB',
  },
  charCount: {
    fontSize: scaleFontSize(10),
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: scaleSpacing(2),
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: scaleSpacing(Spacing.md),
  },

  // Buttons
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: scaleSpacing(Spacing.md),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSpacing(Spacing.sm),
    marginTop: scaleSpacing(Spacing.sm),
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFontSize(FontSizes.md),
    fontWeight: '700',
  },
  skipButton: {
    alignItems: 'center',
    padding: scaleSpacing(Spacing.md),
    marginTop: scaleSpacing(Spacing.xs),
  },
  skipButtonText: {
    color: Colors.textSecondary,
    fontSize: scaleFontSize(FontSizes.sm),
    fontWeight: '500',
  },
});
