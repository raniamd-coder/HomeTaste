import React, { useState } from 'react';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { Button, ErrorBanner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useColors, useTheme } from '../context/ThemeContext';
import type { ProfileStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme';
import { radius, spacing } from '../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { user, signOut, error } = useAuth();
  const { mode, setMode } = useTheme();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);

  function confirmLogout() {
    Alert.alert('Se déconnecter', 'Tu veux vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => void onLogout() },
    ]);
  }

  async function onLogout() {
    setLoading(true);
    await signOut();
    setLoading(false);
  }

  return (
    <Screen>
      {error ? <ErrorBanner message={error} /> : null}

      <Pressable onPress={() => navigation.navigate('Account')} style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.title}>Compte</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
        <Text style={styles.muted}>{user?.email ?? '—'}</Text>
      </Pressable>

      <View style={{ height: spacing.md }} />

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>Mode sombre</Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
        <Text style={styles.muted}>Change l’apparence de l’application.</Text>
      </View>

      <View style={{ flex: 0.5 }} />

      <Button label="Se déconnecter" onPress={confirmLogout} loading={loading} variant="danger" />
    
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    chevron: {
      color: colors.mutedText,
      fontSize: 22,
      fontWeight: '800',
      marginTop: -2,
    },
    muted: {
      color: colors.mutedText,
    },
  });
}
