import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useColors } from '../context/ThemeContext';
import { AddEditRecipeScreen } from '../screens';
import type { AddStackParamList } from './types';

const Stack = createNativeStackNavigator<AddStackParamList>();

export function AddStackNavigator() {
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
      <Stack.Screen name="AddEditRecipe" component={AddEditRecipeScreen} options={{ title: 'Ajouter' }} />
    </Stack.Navigator>
  );
}
