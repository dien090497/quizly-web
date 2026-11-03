export type Question = {
  prompt: string;
  options: string[];
  correctIndex: number;
  timeLimitSeconds: number;
};

export type Quiz = {
  id: number;
  title: string;
  description: string;
  category: string;
  ownerId: number | null;
  isPublic: boolean;
  questions: Question[];
};

export type AuthSession = {
  token: string;
  expiresAt: number;
  user: { id: number; email: string; displayName: string };
};

export type GameHistory = {
  id: number;
  quizId: number;
  quizTitle: string;
  pin: string;
  startedAt: string;
  completedAt: string;
  questionCount: number;
  playerCount: number;
  players: { name: string; score: number; correctAnswers: number; rank: number }[];
};

export type RoomCredentials = {
  pin: string;
  hostKey?: string;
  playerToken?: string;
};

export type RoomView = {
  pin: string;
  quizTitle: string;
  phase: 'WAITING' | 'QUESTION' | 'REVEAL' | 'FINISHED';
  questionIndex: number;
  questionCount: number;
  currentQuestion: {
    prompt: string;
    options: string[];
    correctIndex: number | null;
    timeLimitSeconds: number;
  } | null;
  myAnswerIndex: number | null;
  questionEndsAtMillis: number;
  players: { name: string; score: number; answered: boolean }[];
};

export const CATEGORIES = ['Tất cả', 'Khoa học', 'Lịch sử', 'Địa lý', 'Giải trí', 'Ngôn ngữ'] as const;
export const CARD_COLORS = ['coral', 'violet', 'lime', 'blue', 'pink'] as const;
export const CARD_SYMBOLS = ['✦', '◈', '✳', '⌘', '✺'] as const;
