export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
export const SOCKETS = API.replace(/\/api\/?$/, '').replace(/^http/, 'ws');
export const ROOM_SESSION_KEY = 'quizly-active-room';
export const AUTH_SESSION_KEY = 'quizly-auth-session';
