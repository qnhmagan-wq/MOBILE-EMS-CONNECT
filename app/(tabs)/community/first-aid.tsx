import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Colors } from "@/src/config/theme";
import { scale, scaleFontSize, scaleSpacing } from "@/src/utils/responsive";

interface FirstAidItem {
  id: string;
  title: string;
  imageUrl: string;
  color: string;
}

export default function FirstAidScreen() {
  const router = useRouter();

  const firstAidItems: FirstAidItem[] = [
    {
      id: 'cpr',
      title: 'CPR',
      imageUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=300&fit=crop',
      color: '#EF4444'
    },
    {
      id: 'choking',
      title: 'Choking',
      imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
      color: '#F59E0B'
    },
    {
      id: 'bleeding',
      title: 'Bleeding',
      imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=300&fit=crop',
      color: '#DC2626'
    },
    {
      id: 'burns',
      title: 'Burns',
      imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=300&fit=crop',
      color: '#F97316'
    },
    {
      id: 'fractures',
      title: 'Fractures',
      imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
      color: '#92400E'
    },
    {
      id: 'seizures',
      title: 'Seizures',
      imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=300&fit=crop',
      color: '#EAB308'
    },
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
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.cardOverlay}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
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
    paddingTop: scaleSpacing(60),
    paddingBottom: scaleSpacing(30),
    paddingHorizontal: scaleSpacing(20),
  },
  headerTitle: {
    fontSize: scaleFontSize(28),
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: scaleSpacing(8),
  },
  headerSubtitle: {
    fontSize: scaleFontSize(14),
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    padding: scaleSpacing(20),
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    height: scale(180),
    backgroundColor: "#FFFFFF",
    borderRadius: scale(16),
    marginBottom: scaleSpacing(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: scaleSpacing(12),
    paddingHorizontal: scaleSpacing(16),
  },
  cardTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
});











