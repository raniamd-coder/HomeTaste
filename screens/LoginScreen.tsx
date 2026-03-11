import React, { useEffect, useMemo, useState } from 'react';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '../components/BrandHeader';
import { Screen } from '../components/Screen';
import { Button, ErrorBanner, Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import type { AuthStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme';
import { spacing } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, error, clearError } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 6, [email, password]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      clearError();
    });
    return unsubscribe;
  }, [clearError, navigation]);

  async function onSubmit() {
    setLoading(true);
    await signIn(email.trim(), password);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Screen center contentStyle={styles.inner}>
        <BrandHeader subtitle="Connectez-vous pour accéder à vos recettes." />

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
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
        />

        <Button label="Se connecter" onPress={onSubmit} disabled={!canSubmit} loading={loading} />

        <View style={styles.spacer} />
        <Button label="Créer un compte" onPress={() => navigation.navigate('Register')} variant="ghost" />

        <Text style={styles.footer}>Sauvegardez vos recettes, simplement.</Text>
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
