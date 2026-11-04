import { API } from './config';
import type { AuthSession, GameHistory, Quiz, QuizEdit, RoomView } from './types';

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchQuizzes(): Promise<Quiz[]> {
  const res = await fetch(`${API}/quizzes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch_quizzes_failed');
  return res.json();
}

export async function fetchMyQuizzes(token: string): Promise<QuizEdit[]> {
  const res = await fetch(`${API}/quizzes/mine`, {
    headers: authHeader(token),
    cache: 'no-store',
  });
  if (res.status === 401) throw Object.assign(new Error('unauthorized'), { status: 401 });
  if (!res.ok) throw new Error('fetch_my_quizzes_failed');
  return res.json();
}

export async function createQuiz(
  token: string,
  payload: { title: string; description: string; category: string; isPublic: boolean; questions: unknown[] }
): Promise<QuizEdit> {
  const res = await fetch(`${API}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('create_quiz_failed');
  return res.json();
}

export async function updateQuiz(
  token: string,
  id: number,
  payload: { title: string; description: string; category: string; isPublic: boolean; questions: unknown[] }
): Promise<QuizEdit> {
  const res = await fetch(`${API}/quizzes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('update_quiz_failed');
  return res.json();
}

export async function deleteQuiz(token: string, id: number): Promise<void> {
  const res = await fetch(`${API}/quizzes/${id}`, {
    method: 'DELETE',
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error('delete_quiz_failed');
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('login_failed');
  return res.json();
}

export async function register(email: string, password: string, displayName: string): Promise<AuthSession> {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  if (!res.ok) throw new Error('register_failed');
  return res.json();
}

export function logout(token: string): void {
  // fire-and-forget
  void fetch(`${API}/auth/logout`, { method: 'POST', headers: authHeader(token) });
}

export async function fetchGameHistory(token: string): Promise<GameHistory[]> {
  const res = await fetch(`${API}/games/history/mine`, {
    headers: authHeader(token),
    cache: 'no-store',
  });
  if (res.status === 401) throw Object.assign(new Error('unauthorized'), { status: 401 });
  if (!res.ok) throw new Error('fetch_history_failed');
  return res.json();
}

export async function createRoom(quizId: number, token?: string): Promise<{ pin: string; hostKey: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/games`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ quizId }),
  });
  if (!res.ok) throw new Error('create_room_failed');
  return res.json();
}

export async function joinRoom(pin: string, name: string): Promise<{ pin: string; playerToken: string }> {
  const res = await fetch(`${API}/games/${pin}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('join_room_failed');
  return res.json();
}

export async function fetchRoomView(pin: string, playerToken?: string): Promise<RoomView> {
  const suffix = playerToken ? `?playerToken=${encodeURIComponent(playerToken)}` : '';
  const res = await fetch(`${API}/games/${pin}${suffix}`, { cache: 'no-store' });
  if (!res.ok) throw Object.assign(new Error('room_not_found'), { status: res.status });
  return res.json();
}

export async function roomAction(
  pin: string,
  action: 'start' | 'next',
  hostKey: string
): Promise<RoomView> {
  const res = await fetch(`${API}/games/${pin}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostKey }),
  });
  if (!res.ok) throw new Error('room_action_failed');
  return res.json();
}

export async function submitAnswer(
  pin: string,
  playerToken: string,
  optionIndex: number
): Promise<RoomView> {
  const res = await fetch(`${API}/games/${pin}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerToken, optionIndex }),
  });
  if (!res.ok) throw new Error('submit_answer_failed');
  return res.json();
}
