import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { DispatchProvider } from "@/src/contexts/DispatchContext";
import { View, ActivityIndicator, StyleSheet, Image } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "@/src/config/theme";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for auth to finish loading
        if (!isLoading) {
          // Add a minimum splash screen duration for better UX
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
        setAppIsReady(true);
      } finally {
        // Hide splash screen once app is ready
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [isLoading]);

  useEffect(() => {
    if (!appIsReady || isLoading) return;

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
  }, [isAuthenticated, isLoading, role, segments, appIsReady, router]);

  if (!appIsReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require("../assets/images/597486658_1215193403858896_2072558280615266887_n.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={Colors.textWhite} style={styles.loader} />
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
      <DispatchProvider>
        <RootLayoutNav />
      </DispatchProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  logo: {
    width: 260,
    height: 110,
    marginBottom: 32,
  },
  loader: {
    marginTop: 16,
  },
});
