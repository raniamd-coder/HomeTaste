import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useColors } from '../context/ThemeContext';
import { AccountScreen, SettingsScreen } from '../screens';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  const themed = useColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: themed.surface },
        headerShadowVisible: false,
        headerTitleStyle: { color: themed.text },
        contentStyle: { backgroundColor: themed.background },
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />
      <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Compte' }} />
    </Stack.Navigator>
  );
}
