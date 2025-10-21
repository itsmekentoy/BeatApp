import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { UserProvider } from "./context/UserContext";

// Mock auth context - in a real app, this would check actual auth state
let isLoggedIn = false;
let serverConfigured = false;

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check auth state - replace with actual auth logic
    // For now, start with ServerConfig
    const checkAuth = async () => {
      // In a real app, check if user is logged in and server is configured
      // For now, always start fresh
      isLoggedIn = false;
      serverConfigured = false;
      setIsReady(true);
    };

    checkAuth();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ServerConfig" options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="AddCustomer" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="ViewCustomer" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="EditCustomer" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="CreateTransaction" options={{ presentation: 'card', headerShown: false }} />
      </Stack>
    </UserProvider>
  );
}
