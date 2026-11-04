'use client';

import { useMemo, useState } from 'react';
import { CARD_COLORS, CARD_SYMBOLS, CATEGORIES } from '../lib/types';
import type { AuthSession, Quiz, QuizEdit } from '../lib/types';

type Props = {
  quizzes: Quiz[];
  myQuizzes: QuizEdit[];
  mineOnly: boolean;
  loading: boolean;
  authSession: AuthSession | null;
  onCreateRoom: (quiz: Quiz) => void;
  onEdit: (quiz: QuizEdit) => void;
  onDelete: (quiz: Quiz) => void;
  onCreateQuiz: () => void;
};

const CATEGORY_ICONS: Record<string, string> = {
  'Tất cả': '✳', 'Khoa học': '🧪', 'Lịch sử': '🏛️',
  'Địa lý': '🌍', 'Giải trí': '🎬', 'Ngôn ngữ': '💬',
};

export default function QuizGrid({
  quizzes, myQuizzes, mineOnly, loading, authSession,
  onCreateRoom, onEdit, onDelete, onCreateQuiz,
}: Props) {
  const [category, setCategory] = useState('Tất cả');
  const [search, setSearch] = useState('');

  const visible = useMemo(() =>
    (mineOnly ? myQuizzes : quizzes).filter(q =>
      (category === 'Tất cả' || q.category === category) &&
      `${q.title} ${q.description}`.toLowerCase().includes(search.toLowerCase())
    ) as (Quiz | QuizEdit)[],
    [quizzes, myQuizzes, mineOnly, category, search]
  );

  return (
    <section className="discover" id="discover">
      <div className="section-head">
        <div>
          <span className="eyebrow">THƯ VIỆN CỘNG ĐỒNG</span>
          <h2>Chọn một chủ đề.<br /><em>Khám phá điều mới.</em></h2>
        </div>
        <div className="search-box">
          <span>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm quiz bạn thích..." />
          <kbd>⌘ K</kbd>
        </div>
      </div>

      <div className="filters" id="categories">
        {CATEGORIES.map(item => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={category === item ? 'filter selected' : 'filter'}
          >
            {CATEGORY_ICONS[item]} {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Đang tải thư viện quiz…</div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✳</div>
          <h3>Quiz hay đang chờ bạn tạo</h3>
          <p>Tạo quiz đầu tiên để bắt đầu thư viện của bạn.</p>
          <button className="button button-dark" onClick={onCreateQuiz}>＋ Tạo quiz đầu tiên</button>
        </div>
      ) : (
        <div className="quiz-grid">
          {visible.map((quiz, index) => (
            <article className={`quiz-card ${CARD_COLORS[index % CARD_COLORS.length]}`} key={quiz.id}>
              <div className="card-visual">
                <span className="card-category">{quiz.category}</span>
                {!quiz.isPublic && <span className="private-badge">🔒 RIÊNG TƯ</span>}
                <span className="card-symbol">{CARD_SYMBOLS[index % CARD_SYMBOLS.length]}</span>
                <span className="card-number">QUIZ Nº {String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="card-info">
                <h3>{quiz.title}</h3>
                <p>{quiz.description || 'Một quiz thú vị từ cộng đồng.'}</p>
                <div className="card-bottom">
                  <span>◷ 5 phút　·　✦ {quiz.questions.length} câu</span>
                  <span className="card-play-actions">
                    <button aria-label={`Tạo phòng chơi ${quiz.title}`} onClick={() => onCreateRoom(quiz)}>
                      Phòng PIN <b>＋</b>
                    </button>
                  </span>
                </div>
                {authSession?.user.id === quiz.ownerId && (
                  <div className="owner-actions">
                    <span>Quiz của bạn</span>
                    <div>
                      <button onClick={() => onEdit(quiz as QuizEdit)}>Sửa</button>
                      <button onClick={() => onDelete(quiz)}>Xóa</button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
