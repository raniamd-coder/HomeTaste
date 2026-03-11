import React, { useMemo, useState } from 'react';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { Button, ErrorBanner, Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import type { ProfileStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme';
import { radius, spacing } from '../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Account'>;

export function AccountScreen({ navigation }: Props) {
  const { user, error, clearError, updateEmail, updatePassword } = useAuth();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState(user?.email ?? '');
  const [savingEmail, setSavingEmail] = useState(false);

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const canSaveEmail = useMemo(() => email.trim().length > 5 && email.includes('@'), [email]);
  const canSavePassword = useMemo(
    () => password.length >= 6 && password === password2,
    [password, password2]
  );

  function confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Confirmer', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  }

  async function onSaveEmail() {
    clearError();

    const okConfirm = await confirm(
      "Modifier l'email",
      "Confirmer la modification de l'adresse email ? Selon les réglages Supabase, une confirmation par mail peut être demandée."
    );
    if (!okConfirm) return;

    setSavingEmail(true);
    const ok = await updateEmail(email);
    setSavingEmail(false);

    if (ok) {
      Alert.alert(
        'Email mis à jour',
        "Selon les réglages Supabase, un email de confirmation peut être requis avant le changement effectif.",
        [{ text: 'OK' }]
      );
    }
  }

  async function onSavePassword() {
    clearError();

    if (password !== password2) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    const okConfirm = await confirm(
      'Modifier le mot de passe',
      'Confirmer la modification du mot de passe ?'
    );
    if (!okConfirm) return;

    setSavingPassword(true);
    const ok = await updatePassword(password);
    setSavingPassword(false);

    if (ok) {
      setPassword('');
      setPassword2('');
      Alert.alert('Mot de passe mis à jour', 'Votre mot de passe a été modifié.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }

  return (
    <Screen scroll>
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Email</Text>
        <Text style={styles.muted}>Email actuel: {user?.email ?? '—'}</Text>
        <View style={{ height: spacing.md }} />
        <Field
          label="Nouvel email"
          value={email}
          onChangeText={setEmail}
          placeholder="ex: mail@domaine.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button
          label="Modifier l'email"
          onPress={onSaveEmail}
          disabled={!canSaveEmail || savingEmail}
          loading={savingEmail}
        />
      </View>

      <View style={{ height: spacing.lg }} />

      <View style={styles.card}>
        <Text style={styles.title}>Mot de passe</Text>
        <Text style={styles.muted}>Minimum 6 caractères.</Text>
        <View style={{ height: spacing.md }} />
        <Field
          label="Nouveau mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />
        <Field
          label="Confirmer le mot de passe"
          value={password2}
          onChangeText={setPassword2}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />
        <Button
          label="Modifier le mot de passe"
          onPress={onSavePassword}
          disabled={!canSavePassword || savingPassword}
          loading={savingPassword}
        />
      </View>
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
    title: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    muted: {
      color: colors.mutedText,
    },
  });
}
