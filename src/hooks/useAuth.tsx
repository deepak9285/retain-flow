import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// ─── Demo Mode ────────────────────────────────────────────────────────────────
// When Supabase is not configured, auth runs in demo mode.
// A hardcoded dev credential is accepted to let you explore the full UI.
// DEMO MODE — Remove this before going to production.
const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === '';
const DEMO_EMAIL = 'owner@bloomsalon.com';
const DEMO_PASSWORD = 'demo1234';

// ─── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  demoUser: { email: string } | null;
  loading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoUser, setDemoUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    if (DEMO_MODE) {
      // Check sessionStorage for persisted demo login
      const stored = sessionStorage.getItem('retainflow_demo_user');
      if (stored) {
        setDemoUser(JSON.parse(stored));
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (DEMO_MODE) {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const user = { email };
        setDemoUser(user);
        sessionStorage.setItem('retainflow_demo_user', JSON.stringify(user));
        return { error: null };
      }
      return { error: `Demo mode — use ${DEMO_EMAIL} / ${DEMO_PASSWORD}` };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    if (DEMO_MODE) {
      setDemoUser(null);
      sessionStorage.removeItem('retainflow_demo_user');
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
  };

  const isAuthenticated = DEMO_MODE ? !!demoUser : !!session;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        demoUser,
        loading,
        isAuthenticated,
        isDemoMode: DEMO_MODE,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
