import React from 'react';

import { Image, StyleSheet, Text, View } from 'react-native';

import { useColors } from '../context/ThemeContext';
import type { ThemeColors } from '../theme';
import { spacing } from '../theme';

type Props = {
  title?: string;
  subtitle?: string;
};

export function BrandHeader({ title = 'HomeTaste', subtitle }: Props) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Image source={require('../assets/colored-logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    logo: {
      width: 150,
      height: 150,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 0.2,
    },
    subtitle: {
      marginTop: spacing.xs,
      color: colors.mutedText,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
}
