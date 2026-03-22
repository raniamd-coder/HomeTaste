import React, { useMemo, useState } from 'react';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '../components/BrandHeader';
import { Screen } from '../components/Screen';
import { Button, ErrorBanner, Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import type { AuthStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme';
import { spacing } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp, error } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6, [email, password]);

  async function onSubmit() {
    setLoading(true);
    await signUp(email.trim(), password);
    setLoading(false);

    Alert.alert(
      'Compte créé',
      "Si la confirmation email est activée dans Supabase, vérifiez votre boîte mail. Sinon vous êtes connecté automatiquement.",
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Screen center contentStyle={styles.inner}>
        <BrandHeader title="Créer un compte" subtitle="Email + mot de passe." />

        {error ? <ErrorBanner message={error} /> : null}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ex: mail@domaine.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="min. 6 caractères"
          secureTextEntry
          autoCapitalize="none"
        />

        <Button label="S'inscrire" onPress={onSubmit} disabled={!canSubmit} loading={loading} />
        <View style={styles.spacer} />
        <Button label="Déjà un compte ?" onPress={() => navigation.navigate('Login')} variant="ghost" />

      </Screen>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      paddingTop: spacing.xl,
    },
    spacer: {
      height: spacing.md,
    },
    footer: {
      marginTop: spacing.lg,
      textAlign: 'center',
      color: colors.mutedText,
    },
  });
}
