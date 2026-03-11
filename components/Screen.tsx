import React from 'react';

import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { useColors } from '../context/ThemeContext';
import { spacing } from '../theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  center?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll, center, style, contentStyle }: Props) {
  const colors = useColors();
  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const containerStyle: ViewStyle = {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    ...(center ? { justifyContent: 'center' } : null),
  };

  if (scroll) {
    return (
      <ScrollView style={[baseStyle, style]} contentContainerStyle={[containerStyle, contentStyle]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[baseStyle, containerStyle, style, contentStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
