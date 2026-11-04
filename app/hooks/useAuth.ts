'use client';

import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/api';
import { loadAuthSession, saveAuthSession } from '../lib/session';
import type { AuthSession } from '../lib/types';

export function useAuth() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const session = loadAuthSession();
    if (session) setAuthSession(session);
  }, []);

  const persistAuth = useCallback((session: AuthSession | null) => {
    saveAuthSession(session);
    setAuthSession(session);
  }, []);

  const signOut = useCallback(() => {
    if (authSession) api.logout(authSession.token);
    persistAuth(null);
  }, [authSession, persistAuth]);

  return { authSession, signOut, persistAuth };
}
