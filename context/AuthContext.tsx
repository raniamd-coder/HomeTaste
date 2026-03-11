import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { Session, User } from '@supabase/supabase-js';

import { isSupConfigured, supabase } from '../services/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateEmail: (nextEmail: string) => Promise<boolean>;
  updatePassword: (nextPassword: string) => Promise<boolean>;
  clearError: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    async function init() {
      if (!isSupConfigured()) {
        setError(
          "Supabase n'est pas configuré. Renseigne EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY."
        );
        setInitializing(false);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
      }
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      });

      subscription = listener.subscription;
      setInitializing(false);
    }

    init();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      initializing,
      error,
      clearError: () => setError(null),
      signIn: async (email: string, password: string) => {
        setError(null);
        if (!isSupConfigured()) {
          setError(
            "Supabase n'est pas configuré. Crée un fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY puis redémarre l'app."
          );
          return;
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) setError(signInError.message);
      },
      signUp: async (email: string, password: string) => {
        setError(null);
        if (!isSupConfigured()) {
          setError(
            "Supabase n'est pas configuré. Crée un fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY puis redémarre l'app."
          );
          return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) setError(signUpError.message);
      },
      signOut: async () => {
        setError(null);
        if (!isSupConfigured()) {
          setError(
            "Supabase n'est pas configuré. Crée un fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY puis redémarre l'app."
          );
          return;
        }
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) setError(signOutError.message);
      },
      updateEmail: async (nextEmail: string) => {
        setError(null);
        if (!isSupConfigured()) {
          setError(
            "Supabase n'est pas configuré. Crée un fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY puis redémarre l'app."
          );
          return false;
        }

        const trimmed = nextEmail.trim();
        if (trimmed.length < 5 || !trimmed.includes('@')) {
          setError("Email invalide.");
          return false;
        }

        const { data, error: updateError } = await supabase.auth.updateUser({ email: trimmed });
        if (updateError) {
          setError(updateError.message);
          return false;
        }

        if (data.user) setUser(data.user);
        return true;
      },
      updatePassword: async (nextPassword: string) => {
        setError(null);
        if (!isSupConfigured()) {
          setError(
            "Supabase n'est pas configuré. Crée un fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY puis redémarre l'app."
          );
          return false;
        }

        if (nextPassword.length < 6) {
          setError('Le mot de passe doit faire au moins 6 caractères.');
          return false;
        }

        const { data, error: updateError } = await supabase.auth.updateUser({ password: nextPassword });
        if (updateError) {
          setError(updateError.message);
          return false;
        }

        if (data.user) setUser(data.user);
        return true;
      },
    }),
    [error, initializing, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
