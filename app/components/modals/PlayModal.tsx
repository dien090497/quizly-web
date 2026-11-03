'use client';

import { useState } from 'react';
import type { Quiz } from '../../lib/types';

type Props = { quiz: Quiz; onClose: () => void };

export default function PlayModal({ quiz, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  function choose(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === quiz.questions[index].correctIndex) setScore(s => s + 1);
  }

  function advance() {
    if (index + 1 >= quiz.questions.length) { setFinished(true); return; }
    setIndex(i => i + 1);
    setSelected(null);
  }

  function restart() {
    setIndex(0); setSelected(null); setScore(0); setFinished(false);
  }

  const q = quiz.questions[index];

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="play-modal" aria-label={`Chơi ${quiz.title}`}>
        <button type="button" className="modal-close" onClick={onClose}>×</button>

        {finished ? (
          <div className="result-screen">
            <div className="result-icon">{score === quiz.questions.length ? '🏆' : '✳'}</div>
            <span className="eyebrow">HOÀN THÀNH QUIZ</span>
            <h2>{score === quiz.questions.length ? 'Xuất sắc!' : 'Làm tốt lắm!'}</h2>
            <p>Bạn trả lời đúng <b>{score}/{quiz.questions.length}</b> câu hỏi.</p>
            <div className="result-actions">
              <button className="button button-outline" onClick={restart}>Chơi lại</button>
              <button className="button button-dark" onClick={onClose}>Về thư viện</button>
            </div>
          </div>
        ) : (
          <>
            <div className="play-top">
              <div>
                <span className="eyebrow">{quiz.category.toUpperCase()}</span>
                <h2>{quiz.title}</h2>
              </div>
              <span className="score-pill">✦ {score} điểm</span>
            </div>

            <div className="question-progress">
              <span>CÂU {String(index + 1).padStart(2, '0')} <small>/ {String(quiz.questions.length).padStart(2, '0')}</small></span>
              <div><i style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} /></div>
            </div>

            <h3 className="play-prompt">{q.prompt}</h3>

            <div className="play-options">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correctIndex;
                const state = selected === null ? '' : isCorrect ? ' answer-correct' : selected === i ? ' answer-wrong' : ' answer-muted';
                return (
                  <button key={i} className={`play-option${state}`} onClick={() => choose(i)} disabled={selected !== null}>
                    <span>{String.fromCharCode(65 + i)}</span>
                    {opt}
                    {selected !== null && isCorrect && <b>✓</b>}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div className={`answer-feedback ${selected === q.correctIndex ? 'feedback-good' : 'feedback-bad'}`}>
                {selected === q.correctIndex ? 'Đúng rồi! ✨' : `Đáp án đúng: ${q.options[q.correctIndex]}`}
              </div>
            )}

            <div className="play-footer">
              <span>Chọn đáp án đúng để ghi điểm</span>
              <button className="button button-dark" disabled={selected === null} onClick={advance}>
                {index + 1 === quiz.questions.length ? 'Xem kết quả' : 'Câu tiếp theo'} <span>→</span>
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
