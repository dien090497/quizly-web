'use client';

import { FormEvent } from 'react';
import { CATEGORIES } from '../../lib/types';
import type { Question, QuizEdit } from '../../lib/types';

type Props = {
  editingQuiz: QuizEdit | null;
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  isPublic: boolean; setIsPublic: (v: boolean) => void;
  questions: Question[]; setQuestions: (v: Question[]) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  onClose: () => void;
};

export default function CreateModal({
  editingQuiz, title, setTitle, description, setDescription,
  category, setCategory, isPublic, setIsPublic,
  questions, setQuestions, onSubmit, onClose,
}: Props) {
  function updateQuestion(index: number, patch: Partial<Question>) {
    setQuestions(questions.map((q, i) => i === index ? { ...q, ...patch } : q));
  }

  function addQuestion() {
    setQuestions([...questions, { prompt: '', options: ['', '', '', ''], correctIndex: 0, timeLimitSeconds: 20 }]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="create-modal" onSubmit={onSubmit}>
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <span className="eyebrow">BẮT ĐẦU SÁNG TẠO</span>
        <h2>{editingQuiz ? 'Sửa quiz' : 'Tạo quiz mới'} <em>✳</em></h2>
        <p>{editingQuiz ? 'Cập nhật thông tin và câu hỏi của quiz.' : 'Thêm thông tin và câu hỏi đầu tiên của bạn.'}</p>

        <label>Tên quiz
          <input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Khám phá vũ trụ" />
        </label>
        <label>Mô tả
          <input maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Quiz này nói về điều gì?" />
        </label>
        <label>Chủ đề
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Quyền xem
          <select value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')}>
            <option value="public">Công khai — hiện trong thư viện</option>
            <option value="private">Riêng tư — chỉ mình tôi xem</option>
          </select>
        </label>

        <div className="draft-question-list">
          {questions.map((q, qi) => (
            <section className="draft-question" key={qi}>
              <div className="draft-question-heading">
                <b>Câu hỏi {String(qi + 1).padStart(2, '0')}</b>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qi)}>Xóa câu hỏi</button>
                )}
              </div>
              <label>Nội dung câu hỏi
                <input required value={q.prompt} onChange={e => updateQuestion(qi, { prompt: e.target.value })}
                  placeholder="Ví dụ: Hành tinh nào gần Mặt Trời nhất?" />
              </label>
              <label>Thời gian trả lời
                <select value={q.timeLimitSeconds} onChange={e => updateQuestion(qi, { timeLimitSeconds: Number(e.target.value) })}>
                  <option value={10}>10 giây</option>
                  <option value={15}>15 giây</option>
                  <option value={20}>20 giây</option>
                  <option value={30}>30 giây</option>
                  <option value={60}>60 giây</option>
                </select>
              </label>
              <div className="options-label">Các lựa chọn <small>Chọn đáp án đúng</small></div>
              <div className="option-fields">
                {q.options.map((opt, oi) => (
                  <div className={q.correctIndex === oi ? 'option-row correct' : 'option-row'} key={oi}>
                    <button type="button" className="answer-check" onClick={() => updateQuestion(qi, { correctIndex: oi })}>
                      {q.correctIndex === oi ? '✓' : String.fromCharCode(65 + oi)}
                    </button>
                    <input required value={opt}
                      onChange={e => updateQuestion(qi, { options: q.options.map((v, i) => i === oi ? e.target.value : v) })}
                      placeholder={`Lựa chọn ${oi + 1}`} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <button type="button" className="add-question" disabled={questions.length >= 50} onClick={addQuestion}>
          ＋ Thêm câu hỏi {questions.length}/50
        </button>
        <button className="button button-dark submit-button" type="submit">
          {editingQuiz ? 'Lưu thay đổi' : 'Tạo quiz'} <span>↗</span>
        </button>
      </form>
    </div>
  );
}
