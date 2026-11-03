import { AUTH_SESSION_KEY, ROOM_SESSION_KEY } from './config';
import type { AuthSession, RoomCredentials } from './types';

export function loadAuthSession(): AuthSession | null {
  try {
    const stored = window.sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!stored) return null;
    const restored = JSON.parse(stored) as AuthSession;
    if (restored.token && restored.expiresAt * 1000 > Date.now() && restored.user?.id) return restored;
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  }
  return null;
}

export function saveAuthSession(session: AuthSession | null) {
  if (session) window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  else window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function loadRoomCredentials(): RoomCredentials | null {
  try {
    const stored = window.sessionStorage.getItem(ROOM_SESSION_KEY);
    if (!stored) return null;
    const restored = JSON.parse(stored) as RoomCredentials;
    if (/^\d{6}$/.test(restored.pin) && (restored.hostKey || restored.playerToken)) return restored;
    window.sessionStorage.removeItem(ROOM_SESSION_KEY);
  } catch {
    window.sessionStorage.removeItem(ROOM_SESSION_KEY);
  }
  return null;
}

export function saveRoomCredentials(room: RoomCredentials | null) {
  if (room) window.sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(room));
  else window.sessionStorage.removeItem(ROOM_SESSION_KEY);
}
