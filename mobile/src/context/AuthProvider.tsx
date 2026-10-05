import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isBackendConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  userId: string | null;
  email: string | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, userId: null, email: null, initializing: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(isBackendConfigured);

  useEffect(() => {
    if (!isBackendConfigured) return;
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session);
      })
      .finally(() => {
        if (mounted) setInitializing(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      initializing,
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** For screens inside the signed-in stack, where a user id is guaranteed. */
export function useUserId(): string {
  const { userId } = useAuth();
  return userId ?? '';
}
