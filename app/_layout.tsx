import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen 
        name="AddCustomer" 
        options={{ 
          presentation: 'card',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="ViewCustomer" 
        options={{ 
          presentation: 'card',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="EditCustomer" 
        options={{ 
          presentation: 'card',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="CreateTransaction" 
        options={{ 
          presentation: 'card',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
