import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/src/config/theme";
import {
  scale,
  scaleFontSize,
  scaleSpacing,
  getResponsiveButtonSize,
} from "@/src/utils/responsive";

export default function CommunityHomeScreen() {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressIn = () => {
    setIsPressed(true);
    pressTimer.current = setTimeout(() => {
      // Trigger emergency call after 3 seconds
      handleEmergencyCall();
    }, 3000);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleEmergencyCall = () => {
    setIsPressed(false);
    // Navigate to emergency call screen
    router.push("/(tabs)/community/emergency-call");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="medical" size={scale(32)} color="#FFFFFF" />
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={scale(28)} color="#FFFFFF" />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>EMERGENCY{'\n'}CALL</Text>

        {/* SOS Button Container */}
        <View style={styles.sosContainer}>
          <TouchableOpacity
            style={[styles.sosButton, isPressed && styles.sosButtonPressed]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
          >
            <Text style={styles.sosText}>S O S</Text>
            <Text style={styles.pressText}>PRESS 3 SECOND</Text>
          </TouchableOpacity>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Ionicons name="medkit" size={scale(80)} color="#FFFFFF" />
          <Text style={styles.illustrationText}>Emergency Services</Text>
        </View>
      </View>
    </View>
  );
}

const sosButtonSize = getResponsiveButtonSize(280);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary, // Dark maroon/red
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: scaleSpacing(60),
    paddingHorizontal: scaleSpacing(20),
    paddingBottom: scaleSpacing(20),
  },
  logoContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    gap: scaleSpacing(15),
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: scaleSpacing(40),
  },
  title: {
    fontSize: scaleFontSize(40),
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: scaleSpacing(40),
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sosContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: scale(20),
    padding: scaleSpacing(30),
    marginHorizontal: scaleSpacing(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButton: {
    width: sosButtonSize,
    height: sosButtonSize,
    borderRadius: sosButtonSize / 2,
    backgroundColor: "#DC143C", // Crimson red
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#DC143C",
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.4,
    shadowRadius: scale(16),
    elevation: 12,
    borderWidth: scale(8),
    borderColor: "#FFFFFF",
  },
  sosButtonPressed: {
    backgroundColor: "#B22222", // Darker red when pressed
    transform: [{ scale: 0.95 }],
  },
  sosText: {
    fontSize: scaleFontSize(80),
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: scale(8),
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pressText: {
    fontSize: scaleFontSize(14),
    fontWeight: "700",
    color: "rgba(0, 0, 0, 0.8)",
    letterSpacing: 2,
    marginTop: scaleSpacing(10),
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: scaleSpacing(40),
  },
  illustrationText: {
    fontSize: scaleFontSize(16),
    color: "#FFFFFF",
    marginTop: scaleSpacing(12),
    fontWeight: "600",
  },
});
