import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/config/theme";

interface FirstAidItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function FirstAidScreen() {
  const firstAidItems: FirstAidItem[] = [
    { id: "1", title: "CPR", icon: "heart-circle", color: "#FF3B30" },
    { id: "2", title: "Choking", icon: "hand-left", color: "#FF9500" },
    { id: "3", title: "Bleeding", icon: "water", color: "#DC143C" },
    { id: "4", title: "Burns", icon: "flame", color: "#FF6347" },
    { id: "5", title: "Fractures", icon: "body", color: "#8B4513" },
    { id: "6", title: "Seizures", icon: "warning", color: "#FFB800" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>First Aid Guide</Text>
        <Text style={styles.headerSubtitle}>
          Quick reference for emergency situations
        </Text>
      </View>

      {/* First Aid Items Grid */}
      <ScrollView style={styles.content} contentContainerStyle={styles.gridContainer}>
        {firstAidItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={40} color={item.color} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});






