import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';
import EditHabitScreen from './src/screens/EditHabitScreen';
import CameraProofScreen from './src/screens/CameraProofScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4F46E5',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#F8FAFC',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: '⏰ Habitime',
            }}
          />
          <Stack.Screen
            name="AddHabit"
            component={AddHabitScreen}
            options={{
              title: 'Yeni Alışkanlık Ekle',
              headerBackTitle: 'Geri',
            }}
          />
          <Stack.Screen
            name="EditHabit"
            component={EditHabitScreen}
            options={{
              title: 'Alışkanlığı Düzenle',
              headerBackTitle: 'Geri',
            }}
          />
          <Stack.Screen
            name="CameraProof"
            component={CameraProofScreen}
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
