import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";

export default function VerifyScreen() {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Mask email for display
  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) return email;
    const masked = localPart[0] + "*".repeat(localPart.length - 2) + localPart[localPart.length - 1];
    return `${masked}@${domain}`;
  };

  const CODE_LENGTH = 6;

  const handleCodeChange = (value: string, index: number) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    
    if (numericValue.length > 1) {
      // Handle paste
      const digits = numericValue.slice(0, CODE_LENGTH).split("");
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      
      // Focus last filled input or submit
      const lastFilledIndex = Math.min(index + digits.length - 1, CODE_LENGTH - 1);
      if (lastFilledIndex < CODE_LENGTH - 1 && newCode[lastFilledIndex + 1] === "") {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      } else {
        inputRefs.current[CODE_LENGTH - 1]?.focus();
      }
      
      // Auto-submit if all digits are filled
      if (newCode.every(d => d !== "")) {
        handleVerify(newCode.join(""));
      }
    } else {
      // Single digit input
      const newCode = [...code];
      newCode[index] = numericValue;
      setCode(newCode);

      // Auto-focus next input
      if (numericValue && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all fields are filled
      if (index === CODE_LENGTH - 1 && numericValue) {
        const fullCode = newCode.join("");
        if (fullCode.length === CODE_LENGTH) {
          handleVerify(fullCode);
        }
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const fullCode = verificationCode || code.join("");
    
    if (fullCode.length !== CODE_LENGTH) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email address is missing. Please try signing up again.");
      router.replace("/auth/signup");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await verifyEmail({
        email,
        code: fullCode,
      });
      // Navigation will be handled automatically by AuthContext
    } catch (error: any) {
      let errorMessage = "Verification failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const firstError = Object.values(validationErrors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0] as string;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Error", "Email address is missing.");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      await resendVerificationCode({ email });
      Alert.alert("Success", "Verification code has been resent to your email.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      let errorMessage = "Failed to resend code. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    // Focus first input on mount
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verification</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.message}>
              confirmation: please type the verification send to {maskEmail(email)}
            </Text>

            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[styles.codeInput, error ? styles.codeInputError : null]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={handleResend}
              disabled={isLoading || isResending}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.resendText}>resend</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={() => handleVerify()}
              disabled={isLoading || code.join("").length !== CODE_LENGTH}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: FontSizes.huge,
    fontWeight: "bold",
    color: Colors.textCream,
    textTransform: "uppercase",
  },
  form: {
    backgroundColor: Colors.textCream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  message: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: "center",
    textTransform: "lowercase",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#8B5A3C",
    color: Colors.textWhite,
    minHeight: 50,
    maxWidth: 50,
  },
  codeInputError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  errorContainer: {
    backgroundColor: "#fff0f0",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#ffcccc",
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  resendContainer: {
    alignItems: "flex-end",
    marginBottom: Spacing.lg,
  },
  resendText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: "center",
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: Colors.borderDark,
  },
  buttonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

