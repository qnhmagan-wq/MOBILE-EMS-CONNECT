import React, { useState } from 'react';
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

interface PreArrivalModalProps {
  visible: boolean;
  onClose: () => void;
  dispatchId: number;
  incidentType?: string;
  callerNameDefault?: string;
  onSuccess?: () => void;
}

export const PreArrivalModal: React.FC<PreArrivalModalProps> = ({
  visible,
  onClose,
  dispatchId,
  incidentType,
  callerNameDefault,
  onSuccess,
}) => {
  const [callerName, setCallerName] = useState(callerNameDefault || '');
  const [patientName, setPatientName] = useState('');
  const [sex, setSex] = useState('');
  const [age, setAge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!patientName || !sex || !age) {
      Alert.alert('Required Fields', 'Please fill in Patient Name, Sex, and Age');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      Alert.alert('Invalid Age', 'Please enter a valid age (0-150)');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPreArrival(dispatchId, {
        patient_name: patientName,
        sex: sex as 'Male' | 'Female' | 'Other',
        age: ageNum,
        incident_type: incidentType || 'Unknown',
        caller_name: callerName || undefined,
      });

      Alert.alert(
        'Success',
        'Pre-arrival information submitted successfully',
        [{ text: 'OK', onPress: () => {
          onSuccess?.();
          onClose();
        }}]
      );
    } catch (error: any) {
      Alert.alert(
        'Submission Failed',
        error.response?.data?.message || 'Unable to submit pre-arrival information. Please try again.'
      );
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
                  <Text style={styles.headerTitle}>Pre-Arrival Information</Text>
                  <Text style={styles.headerSubtitle}>(Optional)</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close" size={28} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Form Content */}
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.infoText}>
                    Providing patient information helps prepare medical teams before arrival.
                  </Text>

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
                    />
                  </View>

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
                    />
                  </View>

                  {/* Sex and Age Row */}
                  <View style={styles.row}>
                    <View style={[styles.formGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Sex *</Text>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={sex}
                          onValueChange={setSex}
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
                        <Text style={styles.submitButtonText}>Submit Information</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent backdrop (blurred effect)
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '85%', // Bottom sheet effect
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
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.lg,
    top: Spacing.xl,
    padding: Spacing.xs,
  },
  scrollView: {
    maxHeight: 500,
  },
  formContent: {
    padding: Spacing.lg,
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
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
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
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
  },
  picker: {
    color: Colors.textPrimary,
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
