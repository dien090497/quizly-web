'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveAuthSession } from '../../lib/session';
import type { AuthSession } from '../../lib/types';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const expiresAt = params.get('expiresAt');
    const displayName = params.get('displayName');
    const email = params.get('email');
    const id = params.get('id');
    const avatarUrl = params.get('avatarUrl');

    if (token && expiresAt && displayName && email && id) {
      const session: AuthSession = {
        token,
        expiresAt: Number(expiresAt),
        user: {
          id: Number(id),
          email,
          displayName,
          avatarUrl: avatarUrl ?? undefined,
        },
      };
      saveAuthSession(session);
    }

    // Redirect về trang chủ
    router.replace('/');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif', color: '#6b7a6c' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✳</div>
        <p>Đang đăng nhập…</p>
      </div>
    </div>
  );
}
