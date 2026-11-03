'use client';

import type { AuthSession } from '../lib/types';

type Props = {
  authSession: AuthSession | null;
  mineOnly: boolean;
  onToggleMine: () => void;
  onOpenHistory: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
  onJoinPin: () => void;
  onCreateQuiz: () => void;
};

export default function Navbar({
  authSession, mineOnly, onToggleMine, onOpenHistory,
  onSignOut, onSignIn, onJoinPin, onCreateQuiz,
}: Props) {
  return (
    <header className="nav">
      <a className="brand" href="#top">
        <span className="brand-mark">Q</span> quizly<span className="brand-dot">.</span>
      </a>
      <nav>
        <a className="active" href="#discover">Khám phá</a>
        <a href="#categories">Chủ đề</a>
      </nav>
      <div className="nav-actions">
        {authSession ? (
          <>
            <button className="text-button mine-toggle" onClick={onToggleMine}>
              {mineOnly ? 'Tất cả quiz' : 'Quiz của tôi'}
            </button>
            <button className="text-button history-toggle" onClick={onOpenHistory}>Lịch sử</button>
            <button className="text-button account-toggle" onClick={onSignOut}>
              {authSession.user.displayName} · Đăng xuất
            </button>
          </>
        ) : (
          <button className="text-button login-toggle" onClick={onSignIn}>Đăng nhập</button>
        )}
        <button className="text-button pin-toggle" onClick={onJoinPin}>Nhập mã PIN</button>
        <button className="button button-dark" onClick={onCreateQuiz}>＋ Tạo quiz</button>
      </div>
    </header>
  );
}
