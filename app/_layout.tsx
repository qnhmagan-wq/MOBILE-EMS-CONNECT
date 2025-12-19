import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

function RootLayoutNav() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === "auth";
    const inResponder = segments[0] === "(tabs)" && segments[1] === "responder";
    const inCommunity = segments[0] === "(tabs)" && segments[1] === "community";

    if (!isAuthenticated && !inAuth) {
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuth) {
      if (role === "responder") {
        router.replace("/(tabs)/responder/home");
      } else if (role === "community") {
        router.replace("/(tabs)/community/home");
      }
    } else if (isAuthenticated && role === "responder" && !inResponder) {
      router.replace("/(tabs)/responder/home");
    } else if (isAuthenticated && role === "community" && !inCommunity) {
      router.replace("/(tabs)/community/home");
    }
  }, [isAuthenticated, isLoading, role, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
