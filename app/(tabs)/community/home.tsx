import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "@/src/contexts/AuthContext";

export default function CommunityHomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user?.name}</Text>
          <Text style={styles.subtitle}>Community Dashboard</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency Hotline</Text>
          <Text style={styles.hotlineNumber}>911</Text>
          <Text style={styles.cardDescription}>Call for immediate emergency assistance</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Reports</Text>
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardDescription}>Total incidents reported</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <View style={styles.actionButton}>
              <Text style={styles.actionIcon}>🚨</Text>
              <Text style={styles.actionText}>Report Incident</Text>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionIcon}>📜</Text>
              <Text style={styles.actionText}>View History</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  hotlineNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FF3B30",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#999",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    textAlign: "center",
  },
});
