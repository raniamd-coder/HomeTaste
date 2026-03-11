import React from 'react';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '../context/ThemeContext';
import { AddStackNavigator } from './AddStack';
import { ProfileStackNavigator } from './ProfileStack';
import { RecipesStackNavigator } from './RecipesStack';

type AppTabsParamList = {
  HomeTab: undefined;
  AddTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const colors = useColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === 'HomeTab'
              ? focused
                ? 'home'
                : 'home-outline'
              : route.name === 'AddTab'
                ? focused
                  ? 'add-circle'
                  : 'add-circle-outline'
                : focused
                  ? 'person'
                  : 'person-outline';

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarLabel:
          route.name === 'HomeTab'
            ? 'Accueil'
            : route.name === 'AddTab'
              ? 'Ajouter'
              : 'Profil',
      })}
    >
      <Tab.Screen name="HomeTab" component={RecipesStackNavigator} />
      <Tab.Screen name="AddTab" component={AddStackNavigator} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
