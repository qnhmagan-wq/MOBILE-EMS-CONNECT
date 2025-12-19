import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Expo Boilerplate 🚀</Text>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Ready to build!</Text>
          <Text style={styles.text}>
            This is your clean starting point. Start coding here.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Quick Start</Text>
          <Text style={styles.text}>
            Edit app/index.tsx to see your changes instantly.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
});
