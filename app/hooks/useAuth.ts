'use client';

import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/api';
import { loadAuthSession, saveAuthSession } from '../lib/session';
import type { AuthSession } from '../lib/types';

export function useAuth() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const session = loadAuthSession();
    if (session) setAuthSession(session);
  }, []);

  const persistAuth = useCallback((session: AuthSession | null) => {
    saveAuthSession(session);
    setAuthSession(session);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthSession> => {
    const session = await api.login(email, password);
    persistAuth(session);
    return session;
  }, [persistAuth]);

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<AuthSession> => {
    const session = await api.register(email, password, displayName);
    persistAuth(session);
    return session;
  }, [persistAuth]);

  const signOut = useCallback(() => {
    if (authSession) api.logout(authSession.token);
    persistAuth(null);
  }, [authSession, persistAuth]);

  return { authSession, signIn, signUp, signOut, persistAuth };
}
