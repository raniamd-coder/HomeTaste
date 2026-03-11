import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import { LoginScreen, RegisterScreen } from '../screens';
import { AppTabs } from './AppTabs';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function RootNavigator() {
  const { user, initializing } = useAuth();
  const themed = useColors();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: themed.background }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <AppTabs />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: themed.surface },
            headerShadowVisible: false,
            headerTitleStyle: { color: themed.text },
            contentStyle: { backgroundColor: themed.background },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
