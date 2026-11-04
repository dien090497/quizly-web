'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useQuizzes } from './hooks/useQuizzes';
import { useRoom } from './hooks/useRoom';
import * as api from './lib/api';
import type { Question, Quiz, QuizEdit } from './lib/types';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuizGrid from './components/QuizGrid';
import Toast from './components/Toast';
import AuthModal from './components/modals/AuthModal';
import JoinModal from './components/modals/JoinModal';
import CreateModal from './components/modals/CreateModal';
import RoomModal from './components/modals/RoomModal';
import HistoryModal from './components/modals/HistoryModal';

const EMPTY_QUESTION: Question = { prompt: '', options: ['', '', '', ''], correctIndex: 0, timeLimitSeconds: 20 };

export default function Home() {
  const { authSession, signOut, persistAuth } = useAuth();
  const { quizzes, myQuizzes, loading, refresh } = useQuizzes(authSession);
  const { room, roomView, setRoomView, secondsLeft, persistRoom, leaveRoom } = useRoom();

  const [notice, setNotice] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  // Auth modal
  const [authOpen, setAuthOpen] = useState(false);
  const [createAfterAuth, setCreateAfterAuth] = useState(false);

  // History modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [gameHistory, setGameHistory] = useState<Awaited<ReturnType<typeof api.fetchGameHistory>>>([]);

  // Create/Edit modal
  const [showCreate, setShowCreate] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizEdit | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Khoa học');
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([EMPTY_QUESTION]);

  // Play modal
  // Join modal
  const [joinOpen, setJoinOpen] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────
  function openSignIn() {
    setCreateAfterAuth(false);
    setAuthOpen(true);
  }

  function handleSignOut() { signOut(); setMineOnly(false); setNotice('Đã đăng xuất.'); }

  // ── History ───────────────────────────────────────────────────────────
  async function openHistory() {
    if (!authSession) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      setGameHistory(await api.fetchGameHistory(authSession.token));
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 401) { setHistoryOpen(false); handleSignOut(); setNotice('Phiên đăng nhập đã hết hạn.'); }
      else setNotice('Không tải được lịch sử chơi.');
    } finally {
      setHistoryLoading(false);
    }
  }

  // ── Create / Edit ─────────────────────────────────────────────────────
  function openCreator() {
    if (!authSession) { setCreateAfterAuth(true); setAuthOpen(true); setNotice('Đăng nhập để lưu quiz của bạn.'); return; }
    setEditingQuiz(null); setTitle(''); setDescription(''); setCategory('Khoa học'); setIsPublic(true);
    setQuestions([EMPTY_QUESTION]);
    setShowCreate(true);
  }

  function openEditor(quiz: QuizEdit) {
    setEditingQuiz(quiz); setTitle(quiz.title); setDescription(quiz.description);
    setCategory(quiz.category); setIsPublic(quiz.isPublic);
    setQuestions(quiz.questions.map(q => ({ ...q, options: [...q.options] })));
    setShowCreate(true);
  }

  async function submitQuiz(e: FormEvent) {
    e.preventDefault();
    if (!authSession) return;
    if (questions.some(q => !q.prompt.trim() || q.options.some(o => !o.trim()))) {
      setNotice('Hãy nhập nội dung câu hỏi và đủ 4 lựa chọn cho từng câu.'); return;
    }
    const payload = { title, description, category, isPublic, questions };
    try {
      if (editingQuiz) await api.updateQuiz(authSession.token, editingQuiz.id, payload);
      else await api.createQuiz(authSession.token, payload);
      setShowCreate(false); setMineOnly(true);
      setNotice(editingQuiz ? 'Đã cập nhật quiz!' : 'Quiz đã được tạo!');
      await refresh();
    } catch { setNotice('Chưa tạo được quiz. Kiểm tra API và nội dung nhập.'); }
  }

  async function handleDelete(quiz: Quiz) {
    if (!authSession || !window.confirm(`Xóa quiz "${quiz.title}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await api.deleteQuiz(authSession.token, quiz.id);
      setNotice('Đã xóa quiz.'); await refresh();
    } catch { setNotice('Không xóa được quiz. Hãy thử đăng nhập lại.'); }
  }

  // ── Room ──────────────────────────────────────────────────────────────
  async function handleCreateRoom(quiz: Quiz) {
    try {
      const created = await api.createRoom(quiz.id, authSession?.token);
      persistRoom({ pin: created.pin, hostKey: created.hostKey });
    } catch { setNotice('Không tạo được phòng. Hãy kiểm tra backend và quiz đã có câu hỏi.'); }
  }

  async function handleJoin(pin: string, name: string) {
    const joined = await api.joinRoom(pin, name);
    persistRoom({ pin: joined.pin, playerToken: joined.playerToken });
  }

  async function handleRoomAction(action: 'start' | 'next', hostKey: string) {
    if (!room) return;
    try { setRoomView(await api.roomAction(room.pin, action, hostKey)); }
    catch { setNotice('Không cập nhật được trạng thái phòng.'); }
  }

  async function handleSubmitAnswer(optionIndex: number) {
    if (!room?.playerToken) return;
    try { setRoomView(await api.submitAnswer(room.pin, room.playerToken, optionIndex)); }
    catch { setNotice('Không gửi được câu trả lời. Có thể bạn đã trả lời câu này rồi.'); }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <main className="shell">
      <Navbar
        authSession={authSession}
        mineOnly={mineOnly}
        onToggleMine={() => setMineOnly(v => !v)}
        onOpenHistory={() => void openHistory()}
        onSignOut={handleSignOut}
        onSignIn={openSignIn}
        onJoinPin={() => setJoinOpen(true)}
        onCreateQuiz={openCreator}
      />

      <Hero quizCount={quizzes.length} onCreateQuiz={openCreator} />

      <section className="stats">
        <div><b>{quizzes.length.toString().padStart(2, '0')}</b><span>quiz cộng đồng</span></div>
        <div><b>06</b><span>chủ đề thú vị</span></div>
        <div><b>∞</b><span>điều mới để học</span></div>
        <div className="stats-note">Mỗi câu hỏi là một điều mới ✳</div>
      </section>

      <QuizGrid
        quizzes={quizzes}
        myQuizzes={myQuizzes}
        mineOnly={mineOnly}
        loading={loading}
        authSession={authSession}
        onCreateRoom={quiz => void handleCreateRoom(quiz)}
        onEdit={openEditor}
        onDelete={quiz => void handleDelete(quiz)}
        onCreateQuiz={openCreator}
      />

      <footer>
        <a className="brand" href="#top"><span className="brand-mark">Q</span> quizly<span className="brand-dot">.</span></a>
        <span>Học một chút. Vui một chút. Mỗi ngày. ✳</span>
        <span>© 2026 Quizly</span>
      </footer>

      <Toast message={notice} onDismiss={() => setNotice('')} />

      {authOpen && (
        <AuthModal
          onClose={() => { setAuthOpen(false); setCreateAfterAuth(false); }}
        />
      )}

      {joinOpen && (
        <JoinModal
          onJoin={handleJoin}
          onClose={() => setJoinOpen(false)}
          onNotice={setNotice}
        />
      )}

      {showCreate && (
        <CreateModal
          editingQuiz={editingQuiz}
          title={title} setTitle={setTitle}
          description={description} setDescription={setDescription}
          category={category} setCategory={setCategory}
          isPublic={isPublic} setIsPublic={setIsPublic}
          questions={questions} setQuestions={setQuestions}
          onSubmit={submitQuiz}
          onClose={() => setShowCreate(false)}
        />
      )}

      {room && (
        <RoomModal
          room={room}
          roomView={roomView}
          secondsLeft={secondsLeft}
          onLeave={leaveRoom}
          onRoomAction={handleRoomAction}
          onSubmitAnswer={handleSubmitAnswer}
          onNotice={setNotice}
        />
      )}

      {historyOpen && (
        <HistoryModal
          history={gameHistory}
          loading={historyLoading}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </main>
  );
}
