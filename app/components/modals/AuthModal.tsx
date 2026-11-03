'use client';

import { FormEvent, useState } from 'react';
import type { AuthSession } from '../../lib/types';

type Props = {
  mode: 'login' | 'register';
  onSuccess: (session: AuthSession) => void;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<AuthSession>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<AuthSession>;
  onNotice: (msg: string) => void;
};

export default function AuthModal({ mode: initialMode, onSuccess, onClose, onSignIn, onSignUp, onNotice }: Props) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const session = mode === 'login'
        ? await onSignIn(email, password)
        : await onSignUp(email, password, displayName);
      onSuccess(session);
    } catch {
      onNotice(mode === 'register'
        ? 'Không tạo được tài khoản. Email có thể đã được sử dụng.'
        : 'Email hoặc mật khẩu chưa đúng.');
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="create-modal auth-modal" onSubmit={handleSubmit}>
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <span className="eyebrow">QUIZLY COMMUNITY</span>
        <h2>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'} <em>✳</em></h2>
        <p>{mode === 'login' ? 'Đăng nhập để tạo và quản lý quiz của bạn.' : 'Tạo tài khoản miễn phí để lưu quiz của bạn.'}</p>

        {mode === 'register' && (
          <label>Tên hiển thị
            <input required minLength={2} maxLength={60} value={displayName}
              onChange={e => setDisplayName(e.target.value)} placeholder="Tên của bạn" />
          </label>
        )}
        <label>Email
          <input type="email" required maxLength={254} value={email}
            onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" />
        </label>
        <label>Mật khẩu
          <input type="password" required minLength={mode === 'register' ? 8 : 1} maxLength={72}
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'Ít nhất 8 ký tự' : 'Mật khẩu của bạn'} />
        </label>

        <button className="button button-dark submit-button" type="submit">
          {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <span>→</span>
        </button>
        <button type="button" className="auth-switch"
          onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
