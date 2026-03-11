import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useColors } from '../context/ThemeContext';
import { AddEditRecipeScreen, RecipeDetailScreen, RecipeListScreen } from '../screens';
import type { RecipesStackParamList } from './types';

const Stack = createNativeStackNavigator<RecipesStackParamList>();

export function RecipesStackNavigator() {
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
      <Stack.Screen name="RecipeList" component={RecipeListScreen} options={{ title: 'Accueil' }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Détail' }} />
      <Stack.Screen name="AddEditRecipe" component={AddEditRecipeScreen} options={{ title: 'Recette' }} />
    </Stack.Navigator>
  );
}
