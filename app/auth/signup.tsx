import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import ENV from "@/src/config/env";

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirmation: "",
    general: "",
  });

  // Set debug info on mount
  useEffect(() => {
    try {
      const apiUrl = ENV?.API_BASE_URL || 'ENV NOT LOADED';
      setDebugInfo(apiUrl);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(`Error: ${errorMsg}`);
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const handleSignup = async () => {
    setErrors({
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      phone_number: "",
      password: "",
      password_confirmation: "",
      general: "",
    });

    let hasError = false;
    const newErrors = {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      phone_number: "",
      password: "",
      password_confirmation: "",
      general: "",
    };

    // Validate first name
    if (!firstName.trim()) {
      newErrors.first_name = "First name is required";
      hasError = true;
    } else if (firstName.trim().length < 2) {
      newErrors.first_name = "First name must be at least 2 characters";
      hasError = true;
    }

    // Validate last name
    if (!lastName.trim()) {
      newErrors.last_name = "Last name is required";
      hasError = true;
    } else if (lastName.trim().length < 2) {
      newErrors.last_name = "Last name must be at least 2 characters";
      hasError = true;
    }

    // Validate username
    if (!username.trim()) {
      newErrors.username = "Username is required";
      hasError = true;
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
      hasError = true;
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email";
      hasError = true;
    }

    // Validate phone number
    if (!phoneNumber.trim()) {
      newErrors.phone_number = "Phone number is required";
      hasError = true;
    } else if (!validatePhone(phoneNumber)) {
      newErrors.phone_number = "Please enter a valid phone number";
      hasError = true;
    }

    // Validate password
    if (!password.trim()) {
      newErrors.password = "Password is required";
      hasError = true;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasError = true;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      hasError = true;
    }

    // Validate password confirmation
    if (!passwordConfirmation.trim()) {
      newErrors.password_confirmation = "Please confirm your password";
      hasError = true;
    } else if (password !== passwordConfirmation) {
      newErrors.password_confirmation = "Passwords do not match";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const signupData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        password,
        password_confirmation: passwordConfirmation,
      };

      console.log('Signup attempt with data:', { ...signupData, password: '***', password_confirmation: '***' });

      await signup(signupData);

      // Navigate to verification screen
      router.push({
        pathname: "/auth/verify",
        params: { email: email.trim() },
      });
    } catch (error: any) {
      console.error('Signup error:', error.response?.data || error.message);
      
      // Reset all errors first
      const backendErrors = {
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone_number: "",
        password: "",
        password_confirmation: "",
        general: "",
      };

      if (error.response?.data?.errors) {
        // Handle Laravel validation errors - map to our error state
        const validationErrors = error.response.data.errors;
        
        // Map backend field names to our error state
        Object.keys(validationErrors).forEach((field) => {
          const fieldErrors = validationErrors[field];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            const errorMessage = fieldErrors[0] as string;
            
            // Map backend field names to our form field names
            switch (field) {
              case 'first_name':
                backendErrors.first_name = errorMessage;
                break;
              case 'last_name':
                backendErrors.last_name = errorMessage;
                break;
              case 'username':
                backendErrors.username = errorMessage;
                break;
              case 'email':
                backendErrors.email = errorMessage;
                break;
              case 'phone_number':
                backendErrors.phone_number = errorMessage;
                break;
              case 'password':
                backendErrors.password = errorMessage;
                break;
              case 'password_confirmation':
                backendErrors.password_confirmation = errorMessage;
                break;
              default:
                // For unknown fields, add to general error
                backendErrors.general = errorMessage;
                break;
            }
          }
        });
      }

      // Set general error message only if no field-specific errors were set
      const hasFieldErrors = Object.values(backendErrors).some(
        (err, index) => index < 7 && err !== "" // Check first 7 fields (not general)
      );

      if (!hasFieldErrors) {
        if (error.response?.data?.message) {
          backendErrors.general = error.response.data.message;
        } else if (error.message) {
          backendErrors.general = error.message;
        } else {
          backendErrors.general = "Sign up failed. Please try again.";
        }
      }

      setErrors(backendErrors);
      
      // Only show alert if there's a general error and no field-specific errors
      if (backendErrors.general && !hasFieldErrors) {
        Alert.alert("Sign Up Failed", backendErrors.general);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text style={styles.title}>Sign Up</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>last name</Text>
                <TextInput
                  style={[styles.input, errors.last_name ? styles.inputError : null]}
                  placeholder="Enter last name"
                  placeholderTextColor="#999"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {errors.last_name ? (
                  <Text style={styles.errorText}>{errors.last_name}</Text>
                ) : null}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>first name</Text>
                <TextInput
                  style={[styles.input, errors.first_name ? styles.inputError : null]}
                  placeholder="Enter first name"
                  placeholderTextColor="#999"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {errors.first_name ? (
                  <Text style={styles.errorText}>{errors.first_name}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, errors.username ? styles.inputError : null]}
                placeholder="Enter username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
                editable={!isLoading}
              />
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={[styles.input, errors.phone_number ? styles.inputError : null]}
                placeholder="Enter phone number"
                placeholderTextColor="#999"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!isLoading}
              />
              {errors.phone_number ? (
                <Text style={styles.errorText}>{errors.phone_number}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>password</Text>
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                placeholder="Create a password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isLoading}
              />
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>confirm password</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.password_confirmation ? styles.inputError : null,
                ]}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isLoading}
              />
              {errors.password_confirmation ? (
                <Text style={styles.errorText}>{errors.password_confirmation}</Text>
              ) : null}
            </View>

            {errors.general ? (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.replace("/auth/login")}
                disabled={isLoading}
              >
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Debug info - visible on screen */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>API: {debugInfo || 'Loading...'}</Text>
            </View>
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: "500",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textTransform: "lowercase",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    backgroundColor: "#8B5A3C",
    color: Colors.textWhite,
    minHeight: 48,
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  generalErrorContainer: {
    backgroundColor: "#fff0f0",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#ffcccc",
  },
  generalErrorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  debugContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: '#f0f0f0',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugText: {
    fontSize: FontSizes.xs,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
