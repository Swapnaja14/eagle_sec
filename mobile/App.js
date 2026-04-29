import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Compass, User } from 'lucide-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TakeAssessmentScreen from './src/screens/TakeAssessmentScreen';
import MyTrainingHistoryScreen from './src/screens/MyTrainingHistoryScreen';
import MyCertificatesScreen from './src/screens/MyCertificatesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// SaaS Dark Theme Palette
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0f172a', // Deep blue slate
    card: 'rgba(15, 23, 42, 0.95)',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.1)',
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          position: 'absolute', // Allows content behind tabs for Glassmorphism
          elevation: 0,
          height: 65,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#3b82f6', // Vibrant blue
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Catalog" 
        component={CatalogScreen}
        options={{ tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={AppTheme}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="TakeAssessment" component={TakeAssessmentScreen} />
          <Stack.Screen name="MyTrainingHistory" component={MyTrainingHistoryScreen} />
          <Stack.Screen name="MyCertificates" component={MyCertificatesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
