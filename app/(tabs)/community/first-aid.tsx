import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/config/theme";

interface FirstAidItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function FirstAidScreen() {
  const router = useRouter();

  const firstAidItems: FirstAidItem[] = [
    { id: 'cpr', title: 'CPR', icon: 'heart', color: '#EF4444' },
    { id: 'choking', title: 'Choking', icon: 'hand-left', color: '#F59E0B' },
    { id: 'bleeding', title: 'Bleeding', icon: 'water', color: '#DC2626' },
    { id: 'burns', title: 'Burns', icon: 'flame', color: '#F97316' },
    { id: 'fractures', title: 'Fractures', icon: 'body', color: '#92400E' },
    { id: 'seizures', title: 'Seizures', icon: 'warning', color: '#EAB308' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>First Aid Guide</Text>
        <Text style={styles.headerSubtitle}>
          Tap any category for detailed step-by-step instructions
        </Text>
      </View>

      {/* First Aid Items Grid */}
      <ScrollView style={styles.content} contentContainerStyle={styles.gridContainer}>
        {firstAidItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push(`/(tabs)/community/first-aid-detail?id=${item.id}`)}
            activeOpacity={0.7}
          >
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











