'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Question = { prompt: string; options: string[]; correctIndex: number; timeLimitSeconds: number };
type Quiz = { id: number; title: string; description: string; category: string; ownerId: number | null; isPublic: boolean; questions: Question[] };
type AuthSession = { token: string; expiresAt: number; user: { id: number; email: string; displayName: string } };
type GameHistory = { id: number; quizId: number; quizTitle: string; pin: string; startedAt: string; completedAt: string; questionCount: number; playerCount: number; players: { name: string; score: number; correctAnswers: number; rank: number }[] };
type RoomCredentials = { pin: string; hostKey?: string; playerToken?: string };
type RoomView = { pin: string; quizTitle: string; phase: 'WAITING' | 'QUESTION' | 'REVEAL' | 'FINISHED'; questionIndex: number; questionCount: number; currentQuestion: { prompt: string; options: string[]; correctIndex: number | null; timeLimitSeconds: number } | null; myAnswerIndex: number | null; questionEndsAtMillis: number; players: { name: string; score: number; answered: boolean }[] };
const categories = ['Tất cả', 'Khoa học', 'Lịch sử', 'Địa lý', 'Giải trí', 'Ngôn ngữ'];
const colors = ['coral', 'violet', 'lime', 'blue', 'pink'];
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';
const SOCKETS = API.replace(/\/api\/?$/, '').replace(/^http/, 'ws');
const ROOM_SESSION_KEY = 'quizly-active-room';
const AUTH_SESSION_KEY = 'quizly-auth-session';

export default function Home() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [createAfterAuth, setCreateAfterAuth] = useState(false);
  const [category, setCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [playQuiz, setPlayQuiz] = useState<Quiz | null>(null);
  const [playIndex, setPlayIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [room, setRoom] = useState<RoomCredentials | null>(null);
  const [roomView, setRoomView] = useState<RoomView | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinPin, setJoinPin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Khoa học');
  const [isPublic, setIsPublic] = useState(true);
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([{ prompt: '', options: ['', '', '', ''], correctIndex: 0, timeLimitSeconds: 20 }]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  function persistRoom(nextRoom: RoomCredentials | null) {
    if (typeof window !== 'undefined') {
      if (nextRoom) window.sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify(nextRoom));
      else window.sessionStorage.removeItem(ROOM_SESSION_KEY);
    }
    setRoom(nextRoom);
    setRoomView(null);
  }
  function leaveRoom() { persistRoom(null); }
  function persistAuth(nextAuth: AuthSession | null) {
    if (typeof window !== 'undefined') {
      if (nextAuth) window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextAuth));
      else window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
    setAuthSession(nextAuth);
  }

  async function loadQuizzes() {
    try {
      const response = await fetch(`${API}/quizzes`, { cache: 'no-store' });
      if (!response.ok) throw new Error();
      setQuizzes(await response.json());
    } catch { setNotice('Không kết nối được API. Hãy chạy Spring Boot ở cổng 8081.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadQuizzes(); }, []);
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(ROOM_SESSION_KEY);
      if (!stored) return;
      const restored = JSON.parse(stored) as RoomCredentials;
      if (/^\d{6}$/.test(restored.pin) && (restored.hostKey || restored.playerToken)) setRoom(restored);
      else window.sessionStorage.removeItem(ROOM_SESSION_KEY);
    } catch { window.sessionStorage.removeItem(ROOM_SESSION_KEY); }
  }, []);
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(AUTH_SESSION_KEY);
      if (!stored) return;
      const restored = JSON.parse(stored) as AuthSession;
      if (restored.token && restored.expiresAt * 1000 > Date.now() && restored.user?.id) setAuthSession(restored);
      else window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch { window.sessionStorage.removeItem(AUTH_SESSION_KEY); }
  }, []);

  useEffect(() => {
    if (!authSession) { setMyQuizzes([]); setMineOnly(false); return; }
    fetch(`${API}/quizzes/mine`, { headers: { Authorization: `Bearer ${authSession.token}` }, cache: 'no-store' })
      .then(response => {
        if (response.status === 401) { persistAuth(null); setNotice('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'); return []; }
        return response.ok ? response.json() : [];
      })
      .then(setMyQuizzes)
      .catch(() => setMyQuizzes([]));
  }, [authSession?.token]);

  const visible = useMemo(() => (mineOnly ? myQuizzes : quizzes).filter(q => (category === 'Tất cả' || q.category === category) && `${q.title} ${q.description}`.toLowerCase().includes(search.toLowerCase())), [quizzes, myQuizzes, mineOnly, category, search]);

  function openCreator() {
    if (!authSession) { setCreateAfterAuth(true); setAuthMode('login'); setAuthOpen(true); setNotice('Đăng nhập hoặc tạo tài khoản để lưu quiz của bạn.'); return; }
    setEditingQuizId(null); setTitle(''); setDescription(''); setNewCategory('Khoa học'); setIsPublic(true);
    setDraftQuestions([{ prompt: '', options: ['', '', '', ''], correctIndex: 0, timeLimitSeconds: 20 }]);
    setShowCreate(true);
  }
  function editQuiz(quiz: Quiz) {
    setEditingQuizId(quiz.id); setTitle(quiz.title); setDescription(quiz.description); setNewCategory(quiz.category); setIsPublic(quiz.isPublic);
    setDraftQuestions(quiz.questions.map(question => ({ ...question, options: [...question.options] })));
    setShowCreate(true);
  }
  async function deleteQuiz(quiz: Quiz) {
    if (!authSession || !window.confirm(`Xóa quiz “${quiz.title}”? Thao tác này không thể hoàn tác.`)) return;
    try {
      const response = await fetch(`${API}/quizzes/${quiz.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authSession.token}` } });
      if (!response.ok) throw new Error();
      setNotice('Đã xóa quiz.'); await loadQuizzes();
      const mineResponse = await fetch(`${API}/quizzes/mine`, { headers: { Authorization: `Bearer ${authSession.token}` }, cache: 'no-store' });
      if (mineResponse.ok) setMyQuizzes(await mineResponse.json());
    } catch { setNotice('Không xóa được quiz. Hãy thử đăng nhập lại.'); }
  }

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/auth/${authMode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'register' ? { email, password, displayName } : { email, password }),
      });
      if (!response.ok) throw new Error();
      const session: AuthSession = await response.json();
      persistAuth(session); setAuthOpen(false); setEmail(''); setPassword(''); setDisplayName('');
      setNotice(`Xin chào, ${session.user.displayName}!`);
      if (createAfterAuth) { setCreateAfterAuth(false); setEditingQuizId(null); setShowCreate(true); }
    } catch { setNotice(authMode === 'register' ? 'Không tạo được tài khoản. Email có thể đã được sử dụng.' : 'Email hoặc mật khẩu chưa đúng.'); }
  }

  function signOut() {
    if (authSession) void fetch(`${API}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${authSession.token}` } });
    persistAuth(null); setNotice('Đã đăng xuất.');
  }
  async function openHistory() {
    if (!authSession) return;
    setHistoryOpen(true); setHistoryLoading(true);
    try {
      const response = await fetch(`${API}/games/history/mine`, { headers: { Authorization: `Bearer ${authSession.token}` }, cache: 'no-store' });
      if (response.status === 401) { setHistoryOpen(false); signOut(); setNotice('Phiên đăng nhập đã hết hạn.'); return; }
      if (!response.ok) throw new Error();
      setGameHistory(await response.json());
    } catch { setNotice('Không tải được lịch sử chơi.'); }
    finally { setHistoryLoading(false); }
  }

  async function createQuiz(event: FormEvent) {
    event.preventDefault();
    if (!authSession) { openCreator(); return; }
    if (draftQuestions.some(question => !question.prompt.trim() || question.options.some(option => !option.trim()))) { setNotice('Hãy nhập nội dung câu hỏi và đủ 4 lựa chọn cho từng câu.'); return; }
    try {
      const response = await fetch(`${API}/quizzes${editingQuizId ? `/${editingQuizId}` : ''}`, { method: editingQuizId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession.token}` }, body: JSON.stringify({ title, description, category: newCategory, isPublic, questions: draftQuestions }) });
      if (!response.ok) throw new Error();
      setShowCreate(false); setEditingQuizId(null); setTitle(''); setDescription(''); setIsPublic(true); setDraftQuestions([{ prompt: '', options: ['', '', '', ''], correctIndex: 0, timeLimitSeconds: 20 }]); setMineOnly(true); setNotice(editingQuizId ? 'Đã cập nhật quiz!' : 'Quiz đã được tạo!'); await loadQuizzes();
      const mineResponse = await fetch(`${API}/quizzes/mine`, { headers: { Authorization: `Bearer ${authSession.token}` }, cache: 'no-store' });
      if (mineResponse.ok) setMyQuizzes(await mineResponse.json());
    } catch { setNotice('Chưa tạo được quiz. Kiểm tra API và nội dung nhập.'); }
  }

  function startQuiz(quiz: Quiz) {
    if (!quiz.questions.length) { setNotice('Quiz này chưa có câu hỏi.'); return; }
    setPlayQuiz(quiz); setPlayIndex(0); setSelectedAnswer(null); setScore(0); setFinished(false);
  }
  function chooseAnswer(index: number) {
    if (selectedAnswer !== null || !playQuiz) return;
    setSelectedAnswer(index);
    if (index === playQuiz.questions[playIndex].correctIndex) setScore(value => value + 1);
  }
  function advanceQuiz() {
    if (!playQuiz) return;
    if (playIndex + 1 >= playQuiz.questions.length) setFinished(true);
    else { setPlayIndex(value => value + 1); setSelectedAnswer(null); }
  }
  function updateDraftQuestion(index: number, update: Partial<Question>) {
    setDraftQuestions(current => current.map((question, i) => i === index ? { ...question, ...update } : question));
  }
  async function createRoom(quiz: Quiz) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authSession) headers.Authorization = `Bearer ${authSession.token}`;
      const response = await fetch(`${API}/games`, { method: 'POST', headers, body: JSON.stringify({ quizId: quiz.id }) });
      if (!response.ok) throw new Error();
      const created = await response.json();
      persistRoom({ pin: created.pin, hostKey: created.hostKey });
    } catch { setNotice('Không tạo được phòng. Hãy kiểm tra backend và quiz đã có câu hỏi.'); }
  }
  async function joinRoom(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch(`${API}/games/${joinPin.trim()}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: playerName }) });
      if (!response.ok) throw new Error();
      const joined = await response.json();
      persistRoom({ pin: joined.pin, playerToken: joined.playerToken }); setJoinOpen(false);
    } catch { setNotice('Không vào được phòng. Kiểm tra mã PIN hoặc tên người chơi.'); }
  }
  async function roomAction(action: 'start' | 'next', hostKey: string) {
    if (!room) return;
    try {
      const response = await fetch(`${API}/games/${room.pin}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hostKey }) });
      if (!response.ok) throw new Error(); setRoomView(await response.json());
    } catch { setNotice('Không cập nhật được trạng thái phòng.'); }
  }
  async function submitRoomAnswer(optionIndex: number) {
    if (!room?.playerToken) return;
    try {
      const response = await fetch(`${API}/games/${room.pin}/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerToken: room.playerToken, optionIndex }) });
      if (!response.ok) throw new Error(); setRoomView(await response.json());
    } catch { setNotice('Không gửi được câu trả lời. Có thể bạn đã trả lời câu này rồi.'); }
  }
  useEffect(() => {
    if (!room) { setRoomView(null); return; }
    const refresh = async () => {
      try {
        const suffix = room.playerToken ? `?playerToken=${encodeURIComponent(room.playerToken)}` : '';
        const response = await fetch(`${API}/games/${room.pin}${suffix}`, { cache: 'no-store' });
        if (response.ok) setRoomView(await response.json());
        else if (response.status === 401 || response.status === 404) {
          leaveRoom();
          setNotice('Phòng đã hết hạn hoặc phiên tham gia không còn hợp lệ.');
        }
      } catch { /* Poll again on the next interval if the server is briefly unavailable. */ }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 10000);
    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let reconnectDelay = 500;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      try {
        socket = new WebSocket(`${SOCKETS}/ws/rooms/${room.pin}`);
        socket.onopen = () => { reconnectDelay = 500; void refresh(); };
        socket.onmessage = () => { void refresh(); };
        socket.onclose = () => {
          if (stopped) return;
          reconnectTimer = window.setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, 10000);
        };
        socket.onerror = () => socket?.close();
      } catch {
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 10000);
      }
    };
    connect();
    return () => { stopped = true; window.clearInterval(interval); if (reconnectTimer) window.clearTimeout(reconnectTimer); socket?.close(); };
  }, [room?.pin, room?.playerToken]);
  useEffect(() => {
    const deadline = roomView?.phase === 'QUESTION' ? roomView.questionEndsAtMillis : 0;
    if (!deadline) { setSecondsLeft(null); return; }
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, 150);
    return () => window.clearInterval(interval);
  }, [roomView?.questionEndsAtMillis, roomView?.phase]);

  return <main className="shell">
    <header className="nav"><a className="brand" href="#top"><span className="brand-mark">Q</span> quizly<span className="brand-dot">.</span></a><nav><a className="active" href="#discover">Khám phá</a><a href="#categories">Chủ đề</a></nav><div className="nav-actions">{authSession ? <><button className="text-button mine-toggle" onClick={() => setMineOnly(value => !value)}>{mineOnly ? 'Tất cả quiz' : 'Quiz của tôi'}</button><button className="text-button history-toggle" onClick={() => void openHistory()}>Lịch sử</button><button className="text-button account-toggle" onClick={signOut}>{authSession.user.displayName} · Đăng xuất</button></> : <button className="text-button login-toggle" onClick={() => { setCreateAfterAuth(false); setAuthMode('login'); setAuthOpen(true); }}>Đăng nhập</button>}<button className="text-button pin-toggle" onClick={() => setJoinOpen(true)}>Nhập mã PIN</button><button className="button button-dark" onClick={openCreator}>＋ Tạo quiz</button></div></header>
    <section className="hero" id="top"><div className="hero-copy"><span className="eyebrow"><span className="live-dot"/> HỌC VUI, NHỚ LÂU</span><h1>Kiến thức hay.<br/><em>Cuộc chơi vui.</em></h1><p>Khám phá những quiz thú vị hoặc tự tạo một bộ câu hỏi cho bạn bè, lớp học và cộng đồng.</p><div className="hero-actions"><a className="button button-lime" href="#discover">Khám phá quiz <span>↗</span></a><button className="button button-outline" onClick={openCreator}>Tạo quiz của bạn</button></div><div className="social-proof"><div className="avatar-stack"><i>🧑🏻</i><i>👩🏽</i><i>👨🏻</i><i>👩🏼</i></div><span><b>{quizzes.length || '—'}</b> quiz đang chờ bạn khám phá</span></div></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="spark spark-a">✳</div><div className="spark spark-b">✦</div><div className="quiz-paper"><div className="paper-top"><span>✳ QUIZ OF THE DAY</span><span>•••</span></div><div className="paper-icon">🌍</div><h3>Bạn biết gì về<br/>thế giới quanh ta?</h3><div className="paper-meta"><span>◷ 5 phút</span><span>✦ 8 câu hỏi</span></div><div className="paper-progress"><i/></div></div><div className="float-badge badge-streak">🔥 <b>7 ngày</b><small>chuỗi học tập</small></div><div className="float-badge badge-score"><span>⭐</span><b>+250 XP</b><small>điểm hôm nay</small></div></div></section>
    <section className="stats"><div><b>{quizzes.length.toString().padStart(2, '0')}</b><span>quiz cộng đồng</span></div><div><b>06</b><span>chủ đề thú vị</span></div><div><b>∞</b><span>điều mới để học</span></div><div className="stats-note">Mỗi câu hỏi là một điều mới ✳</div></section>
    <section className="discover" id="discover"><div className="section-head"><div><span className="eyebrow">THƯ VIỆN CỘNG ĐỒNG</span><h2>Chọn một chủ đề.<br/><em>Khám phá điều mới.</em></h2></div><div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm quiz bạn thích..."/><kbd>⌘ K</kbd></div></div><div className="filters" id="categories">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'filter selected' : 'filter'}>{item === 'Tất cả' ? '✳' : item === 'Khoa học' ? '🧪' : item === 'Lịch sử' ? '🏛️' : item === 'Địa lý' ? '🌍' : item === 'Giải trí' ? '🎬' : '💬'} {item}</button>)}</div>
      {loading ? <div className="empty-state">Đang tải thư viện quiz…</div> : visible.length === 0 ? <div className="empty-state"><div className="empty-icon">✳</div><h3>Quiz hay đang chờ bạn tạo</h3><p>Tạo quiz đầu tiên để bắt đầu thư viện của bạn.</p><button className="button button-dark" onClick={openCreator}>＋ Tạo quiz đầu tiên</button></div> : <div className="quiz-grid">{visible.map((quiz, index) => <article className={`quiz-card ${colors[index % colors.length]}`} key={quiz.id}><div className="card-visual"><span className="card-category">{quiz.category}</span>{!quiz.isPublic && <span className="private-badge">🔒 RIÊNG TƯ</span>}<span className="card-symbol">{['✦', '◈', '✳', '⌘', '✺'][index % 5]}</span><span className="card-number">QUIZ Nº {String(index + 1).padStart(2, '0')}</span></div><div className="card-info"><h3>{quiz.title}</h3><p>{quiz.description || 'Một quiz thú vị từ cộng đồng.'}</p><div className="card-bottom"><span>◷ 5 phút　·　✦ {quiz.questions.length} câu</span><span className="card-play-actions"><button aria-label={`Chơi ${quiz.title}`} onClick={() => startQuiz(quiz)}>Chơi ngay <b>↗</b></button><button aria-label={`Tạo phòng chơi ${quiz.title}`} onClick={() => void createRoom(quiz)}>Phòng PIN <b>＋</b></button></span></div>{authSession?.user.id === quiz.ownerId && <div className="owner-actions"><span>Quiz của bạn</span><div><button onClick={() => editQuiz(quiz)}>Sửa</button><button onClick={() => void deleteQuiz(quiz)}>Xóa</button></div></div>}</div></article>)}</div>}
    </section>
    <footer><a className="brand" href="#top"><span className="brand-mark">Q</span> quizly<span className="brand-dot">.</span></a><span>Học một chút. Vui một chút. Mỗi ngày. ✳</span><span>© 2026 Quizly</span></footer>
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    {room && <div className="modal-backdrop room-backdrop"><section className="room-modal"><button type="button" className="modal-close" onClick={() => leaveRoom()}>×</button>{!roomView ? <div className="room-wait"><span className="eyebrow">ĐANG KẾT NỐI</span><h2>Đang tải phòng chơi…</h2></div> : <><div className="room-heading"><div><span className="eyebrow">{room.hostKey ? 'BẠN LÀ HOST' : 'PHÒNG CHƠI'} · {roomView.phase === 'WAITING' ? 'SẮP BẮT ĐẦU' : roomView.phase === 'QUESTION' ? 'ĐANG TRẢ LỜI' : roomView.phase === 'REVEAL' ? 'ĐÁP ÁN' : 'ĐÃ KẾT THÚC'}</span><h2>{roomView.quizTitle}</h2></div><div className="room-pin"><small>MÃ PIN</small><b>{roomView.pin}</b></div></div>{roomView.phase === 'WAITING' ? <div className="lobby-content"><div className="lobby-invite"><span>Chia sẻ mã này với người chơi</span><b>{roomView.pin}</b><small>Vào quizly và chọn “Nhập mã PIN”</small></div><div className="lobby-players"><div className="room-section-title">NGƯỜI CHƠI <b>{roomView.players.length}</b></div>{roomView.players.length ? <div className="player-chips">{roomView.players.map((player, i) => <span key={`${player.name}-${i}`}>✳ {player.name}</span>)}</div> : <p>Đang chờ người chơi tham gia…</p>}</div>{room.hostKey ? <button className="button button-dark room-main-action" onClick={() => void roomAction('start', room.hostKey!)}>Bắt đầu trò chơi <span>→</span></button> : <p className="room-hint">Bạn đã vào phòng. Host sẽ bắt đầu ngay khi mọi người sẵn sàng.</p>}</div> : roomView.phase === 'FINISHED' ? <div className="room-finished"><div className="result-icon">🏆</div><span className="eyebrow">BẢNG XẾP HẠNG CUỐI</span><div className="room-leaderboard">{[...roomView.players].sort((a, b) => b.score - a.score).map((player, i) => <div className="leader-row" key={`${player.name}-${i}`}><b className="leader-rank">{i + 1}</b><span>{player.name}</span><strong>{player.score} điểm</strong></div>)}</div><button className="button button-dark room-main-action" onClick={() => leaveRoom()}>Về thư viện</button></div> : <><div className="room-progress"><span>CÂU {String(roomView.questionIndex + 1).padStart(2, '0')} / {String(roomView.questionCount).padStart(2, '0')}</span><span>{roomView.players.filter(player => player.answered).length}/{roomView.players.length} đã trả lời</span>{secondsLeft !== null && <b className={secondsLeft <= 5 ? 'room-countdown urgent' : 'room-countdown'}>◷ {secondsLeft}s</b>}</div><h3 className="room-question">{roomView.currentQuestion?.prompt}</h3><div className="room-options">{roomView.currentQuestion?.options.map((option, i) => { const isReveal = roomView.phase === 'REVEAL'; const isPicked = roomView.myAnswerIndex === i; const isCorrect = roomView.currentQuestion?.correctIndex === i; return <button key={i} disabled={room.hostKey !== undefined || roomView.phase !== 'QUESTION' || roomView.myAnswerIndex !== null} className={`room-option${isReveal && isCorrect ? ' room-correct' : ''}${isPicked && !isCorrect ? ' room-wrong' : ''}${isPicked ? ' room-picked' : ''}`} onClick={() => void submitRoomAnswer(i)}><span>{String.fromCharCode(65 + i)}</span>{option}{isReveal && isCorrect && <b>✓</b>}{isPicked && !isReveal && <small>Đã chọn</small>}</button>; })}</div>{roomView.phase === 'QUESTION' && (room.hostKey ? <div className="room-host-controls"><p>Người chơi đã trả lời: {roomView.players.filter(player => player.answered).length}/{roomView.players.length}</p><button className="button button-dark" onClick={() => void roomAction('next', room.hostKey!)}>Hiện đáp án <span>→</span></button></div> : <p className="room-hint">{roomView.myAnswerIndex !== null ? 'Đã ghi nhận câu trả lời. Chờ host hiện đáp án…' : 'Chọn một đáp án để ghi điểm.'}</p>)}{roomView.phase === 'REVEAL' && <><div className="room-scoreboard">{[...roomView.players].sort((a, b) => b.score - a.score).slice(0, 5).map((player, i) => <div className="leader-row" key={`${player.name}-${i}`}><b className="leader-rank">{i + 1}</b><span>{player.name}</span><strong>{player.score} điểm</strong></div>)}</div>{room.hostKey && <button className="button button-dark room-main-action" onClick={() => void roomAction('next', room.hostKey!)}>{roomView.questionIndex + 1 === roomView.questionCount ? 'Xem bảng xếp hạng' : 'Câu tiếp theo'} <span>→</span></button>}</>}</>}</>}</section></div>}
    {historyOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setHistoryOpen(false); }}><section className="history-modal"><button type="button" className="modal-close" onClick={() => setHistoryOpen(false)}>×</button><span className="eyebrow">TỔNG KẾT CÁC PHÒNG BẠN HOST</span><h2>Lịch sử chơi <em>✳</em></h2>{historyLoading ? <p className="history-empty">Đang tải kết quả…</p> : gameHistory.length === 0 ? <div className="history-empty"><div className="empty-icon">🏆</div><h3>Chưa có kết quả nào</h3><p>Kết quả sẽ xuất hiện ở đây sau khi một phòng chơi kết thúc.</p></div> : <div className="history-list">{gameHistory.map(game => <article className="history-card" key={game.id}><div className="history-card-head"><div><span className="history-date">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(game.completedAt))}</span><h3>{game.quizTitle}</h3></div><span className="history-pin">PIN {game.pin}</span></div><p>{game.playerCount} người chơi · {game.questionCount} câu hỏi</p><div className="history-winners">{game.players.slice(0, 3).map(player => <span key={player.rank}><b>{player.rank}.</b> {player.name} <strong>{player.score} điểm</strong></span>)}</div></article>)}</div>}</section></div>}
    {authOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { setAuthOpen(false); setCreateAfterAuth(false); } }}><form className="create-modal auth-modal" onSubmit={authenticate}><button type="button" className="modal-close" onClick={() => { setAuthOpen(false); setCreateAfterAuth(false); }}>×</button><span className="eyebrow">QUIZLY COMMUNITY</span><h2>{authMode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'} <em>✳</em></h2><p>{authMode === 'login' ? 'Đăng nhập để tạo và quản lý quiz của bạn.' : 'Tạo tài khoản miễn phí để lưu quiz của bạn.'}</p>{authMode === 'register' && <label>Tên hiển thị<input required minLength={2} maxLength={60} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tên của bạn"/></label>}<label>Email<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@example.com"/></label><label>Mật khẩu<input type="password" required minLength={authMode === 'register' ? 8 : 1} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} placeholder={authMode === 'register' ? 'Ít nhất 8 ký tự' : 'Mật khẩu của bạn'}/></label><button className="button button-dark submit-button" type="submit">{authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} <span>→</span></button><button type="button" className="auth-switch" onClick={() => setAuthMode(mode => mode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</button></form></div>}
    {joinOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setJoinOpen(false); }}><form className="create-modal join-modal" onSubmit={joinRoom}><button type="button" className="modal-close" onClick={() => setJoinOpen(false)}>×</button><span className="eyebrow">THAM GIA CÙNG BẠN BÈ</span><h2>Nhập mã PIN <em>✳</em></h2><p>Nhập mã 6 chữ số do host chia sẻ với bạn.</p><label>Mã PIN<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={joinPin} onChange={e => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456"/></label><label>Tên hiển thị<input required maxLength={24} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Tên của bạn"/></label><button className="button button-dark submit-button" type="submit">Vào phòng <span>→</span></button></form></div>}
    {playQuiz && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setPlayQuiz(null); }}><section className="play-modal" aria-label={`Chơi ${playQuiz.title}`}><button type="button" className="modal-close" onClick={() => setPlayQuiz(null)}>×</button>{finished ? <div className="result-screen"><div className="result-icon">{score === playQuiz.questions.length ? '🏆' : '✳'}</div><span className="eyebrow">HOÀN THÀNH QUIZ</span><h2>{score === playQuiz.questions.length ? 'Xuất sắc!' : 'Làm tốt lắm!'}</h2><p>Bạn trả lời đúng <b>{score}/{playQuiz.questions.length}</b> câu hỏi.</p><div className="result-actions"><button className="button button-outline" onClick={() => startQuiz(playQuiz)}>Chơi lại</button><button className="button button-dark" onClick={() => setPlayQuiz(null)}>Về thư viện</button></div></div> : <><div className="play-top"><div><span className="eyebrow">{playQuiz.category.toUpperCase()}</span><h2>{playQuiz.title}</h2></div><span className="score-pill">✦ {score} điểm</span></div><div className="question-progress"><span>CÂU {String(playIndex + 1).padStart(2, '0')} <small>/ {String(playQuiz.questions.length).padStart(2, '0')}</small></span><div><i style={{ width: `${((playIndex + 1) / playQuiz.questions.length) * 100}%` }}/></div></div><h3 className="play-prompt">{playQuiz.questions[playIndex].prompt}</h3><div className="play-options">{playQuiz.questions[playIndex].options.map((option, index) => { const question = playQuiz.questions[playIndex]; const isCorrect = index === question.correctIndex; const state = selectedAnswer === null ? '' : isCorrect ? ' answer-correct' : selectedAnswer === index ? ' answer-wrong' : ' answer-muted'; return <button key={index} className={`play-option${state}`} onClick={() => chooseAnswer(index)} disabled={selectedAnswer !== null}><span>{String.fromCharCode(65 + index)}</span>{option}{selectedAnswer !== null && isCorrect && <b>✓</b>}</button>; })}</div>{selectedAnswer !== null && <div className={`answer-feedback ${selectedAnswer === playQuiz.questions[playIndex].correctIndex ? 'feedback-good' : 'feedback-bad'}`}>{selectedAnswer === playQuiz.questions[playIndex].correctIndex ? 'Đúng rồi! ✨' : `Đáp án đúng: ${playQuiz.questions[playIndex].options[playQuiz.questions[playIndex].correctIndex]}`}</div>}<div className="play-footer"><span>Chọn đáp án đúng để ghi điểm</span><button className="button button-dark" disabled={selectedAnswer === null} onClick={advanceQuiz}>{playIndex + 1 === playQuiz.questions.length ? 'Xem kết quả' : 'Câu tiếp theo'} <span>→</span></button></div></>}</section></div>}
    {showCreate && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreate(false); }}><form className="create-modal" onSubmit={createQuiz}><button type="button" className="modal-close" onClick={() => setShowCreate(false)}>×</button><span className="eyebrow">BẮT ĐẦU SÁNG TẠO</span><h2>{editingQuizId ? 'Sửa quiz' : 'Tạo quiz mới'} <em>✳</em></h2><p>{editingQuizId ? 'Cập nhật thông tin và câu hỏi của quiz.' : 'Thêm thông tin và câu hỏi đầu tiên của bạn.'}</p><label>Tên quiz<input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Khám phá vũ trụ"/></label><label>Mô tả<input maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Quiz này nói về điều gì?"/></label><label>Chủ đề<select value={newCategory} onChange={e => setNewCategory(e.target.value)}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>Quyền xem<select value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')}><option value="public">Công khai — hiện trong thư viện</option><option value="private">Riêng tư — chỉ mình tôi xem</option></select></label><div className="draft-question-list">{draftQuestions.map((question, questionIndex) => <section className="draft-question" key={questionIndex}><div className="draft-question-heading"><b>Câu hỏi {String(questionIndex + 1).padStart(2, '0')}</b>{draftQuestions.length > 1 && <button type="button" onClick={() => setDraftQuestions(current => current.filter((_, i) => i !== questionIndex))}>Xóa câu hỏi</button>}</div><label>Nội dung câu hỏi<input required value={question.prompt} onChange={e => updateDraftQuestion(questionIndex, { prompt: e.target.value })} placeholder="Ví dụ: Hành tinh nào gần Mặt Trời nhất?"/></label><label>Thời gian trả lời<select value={question.timeLimitSeconds} onChange={e => updateDraftQuestion(questionIndex, { timeLimitSeconds: Number(e.target.value) })}><option value={10}>10 giây</option><option value={15}>15 giây</option><option value={20}>20 giây</option><option value={30}>30 giây</option><option value={60}>60 giây</option></select></label><div className="options-label">Các lựa chọn <small>Chọn đáp án đúng</small></div><div className="option-fields">{question.options.map((option, optionIndex) => <div className={question.correctIndex === optionIndex ? 'option-row correct' : 'option-row'} key={optionIndex}><button type="button" className="answer-check" onClick={() => updateDraftQuestion(questionIndex, { correctIndex: optionIndex })}>{question.correctIndex === optionIndex ? '✓' : String.fromCharCode(65 + optionIndex)}</button><input required value={option} onChange={e => updateDraftQuestion(questionIndex, { options: question.options.map((value, i) => i === optionIndex ? e.target.value : value) })} placeholder={`Lựa chọn ${optionIndex + 1}`}/></div>)}</div></section>)}</div><button type="button" className="add-question" disabled={draftQuestions.length >= 50} onClick={() => setDraftQuestions(current => [...current, { prompt: '', options: ['', '', '', ''], correctIndex: 0, timeLimitSeconds: 20 }])}>＋ Thêm câu hỏi {draftQuestions.length}/50</button><button className="button button-dark submit-button" type="submit">{editingQuizId ? 'Lưu thay đổi' : 'Tạo quiz'} <span>↗</span></button></form></div>}
  </main>;
}
