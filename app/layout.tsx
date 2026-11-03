import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quizly — Học vui mỗi ngày',
  description: 'Khám phá, tạo và chơi quiz cùng bạn bè.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
