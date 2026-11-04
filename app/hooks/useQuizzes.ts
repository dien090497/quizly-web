'use client';

import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { AuthSession, Quiz, QuizEdit } from '../lib/types';

export function useQuizzes(authSession: AuthSession | null) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<QuizEdit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuizzes = useCallback(async () => {
    try {
      setQuizzes(await api.fetchQuizzes());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyQuizzes = useCallback(async (token: string) => {
    try {
      setMyQuizzes(await api.fetchMyQuizzes(token));
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 401) setMyQuizzes([]);
      else setMyQuizzes([]);
    }
  }, []);

  useEffect(() => { void loadQuizzes(); }, [loadQuizzes]);

  useEffect(() => {
    if (!authSession) { setMyQuizzes([]); return; }
    void loadMyQuizzes(authSession.token);
  }, [authSession?.token, loadMyQuizzes]);

  const refresh = useCallback(async () => {
    await loadQuizzes();
    if (authSession) await loadMyQuizzes(authSession.token);
  }, [loadQuizzes, loadMyQuizzes, authSession]);

  return { quizzes, myQuizzes, loading, refresh };
}
