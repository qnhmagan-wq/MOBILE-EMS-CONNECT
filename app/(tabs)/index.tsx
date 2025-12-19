import { Redirect } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";

export default function TabsIndex() {
  const { role } = useAuth();

  if (role === "responder") {
    return <Redirect href="/(tabs)/responder/home" />;
  } else if (role === "community") {
    return <Redirect href="/(tabs)/community/home" />;
  }

  return <Redirect href="/auth/login" />;
}
