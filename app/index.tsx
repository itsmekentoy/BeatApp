import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Customer from './components/Customer';
import DoorControl from './components/DoorControl';
import Expenses from './components/Expenses';
import Home from './components/Home';
import Settings from './components/Settings';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ height: 32 }} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string = '';
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Customer') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Door Control') {
              iconName = focused ? 'key' : 'key-outline';
            } else if (route.name === 'Expenses') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#FF6B35',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Customer" component={Customer} />
        <Tab.Screen name="Door Control" component={DoorControl} />
        <Tab.Screen name="Expenses" component={Expenses} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}