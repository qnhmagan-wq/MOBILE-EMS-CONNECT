import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "@/src/contexts/AuthContext";

export default function ResponderHomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user?.name}</Text>
          <Text style={styles.subtitle}>Responder Dashboard</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Incidents</Text>
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardDescription}>No active incidents at this time</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Responses</Text>
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardDescription}>Total responses today</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Available</Text>
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
  statusBadge: {
    backgroundColor: "#34C759",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
