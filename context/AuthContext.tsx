import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { Session, User } from '@supabase/supabase-js';

import { isSupConfigured, supabase } from '../services/supabase';

function toReadableAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes('network request failed') || lower.includes('failed to fetch')) {
    return "Connexion impossible a Supabase. Verifiez EXPO_PUBLIC_SUPABASE_URL et votre connexion reseau.";
  }

  if (lower.includes('getaddrinfo') || lower.includes('name could not be resolved') || lower.includes('nxdomain')) {
    return "URL Supabase invalide ou introuvable. Verifiez l'URL de projet dans le fichier .env.";
  }

  return message;
}

function isNetworkLikeError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('getaddrinfo') ||
    lower.includes('name could not be resolved') ||
    lower.includes('nxdomain')
  );
}

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

      try {
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
      } catch (err) {
        if (isNetworkLikeError(err)) {
          supabase.auth.stopAutoRefresh();
        }
        setError(toReadableAuthError(err));
      } finally {
        setInitializing(false);
      }
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
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) setError(signInError.message);
        } catch (err) {
          setError(toReadableAuthError(err));
        }
      },
      signUp: async (email: string, password: string) => {
        setError(null);
        if (!isSupConfigured()) {
          setError(
            "Supabase n'est pas configuré. Crée un fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY puis redémarre l'app."
          );
          return;
        }
        try {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          if (signUpError) setError(signUpError.message);
        } catch (err) {
          setError(toReadableAuthError(err));
        }
      },
      signOut: async () => {
        setError(null);
        if (!isSupConfigured()) {
          setError(
            "Supabase n'est pas configuré. Crée un fichier .env avec EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY puis redémarre l'app."
          );
          return;
        }
        try {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) setError(signOutError.message);
        } catch (err) {
          setError(toReadableAuthError(err));
        }
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

        try {
          const { data, error: updateError } = await supabase.auth.updateUser({ email: trimmed });
          if (updateError) {
            setError(updateError.message);
            return false;
          }

          if (data.user) setUser(data.user);
          return true;
        } catch (err) {
          setError(toReadableAuthError(err));
          return false;
        }
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

        try {
          const { data, error: updateError } = await supabase.auth.updateUser({ password: nextPassword });
          if (updateError) {
            setError(updateError.message);
            return false;
          }

          if (data.user) setUser(data.user);
          return true;
        } catch (err) {
          setError(toReadableAuthError(err));
          return false;
        }
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
