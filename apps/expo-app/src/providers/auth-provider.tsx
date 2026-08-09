import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, signOut as amplifySignOut, type AuthUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import type { Profile } from '@cinepals/types';

import { getProfile } from '@/lib/graphql-client';

type AuthStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      const currentProfile = await getProfile();
      setProfile(currentProfile);
      setStatus(currentProfile ? 'ready' : 'needsProfile');
    } catch {
      setUser(null);
      setProfile(null);
      setStatus('signedOut');
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signedOut') {
        refresh();
      }
    });
    return unsubscribe;
  }, [refresh]);

  async function signOut() {
    await amplifySignOut();
  }

  return (
    <AuthContext.Provider value={{ status, user, profile, refreshProfile: refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthUser must be used within AuthProvider');
  }
  return ctx;
}
