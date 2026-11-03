'use client';

import type { RoomCredentials, RoomView } from '../../lib/types';

type Props = {
  room: RoomCredentials;
  roomView: RoomView | null;
  secondsLeft: number | null;
  onLeave: () => void;
  onRoomAction: (action: 'start' | 'next', hostKey: string) => Promise<void>;
  onSubmitAnswer: (optionIndex: number) => Promise<void>;
  onNotice: (msg: string) => void;
};

const PHASE_LABEL: Record<RoomView['phase'], string> = {
  WAITING: 'SẮP BẮT ĐẦU', QUESTION: 'ĐANG TRẢ LỜI',
  REVEAL: 'ĐÁP ÁN', FINISHED: 'ĐÃ KẾT THÚC',
};

export default function RoomModal({ room, roomView, secondsLeft, onLeave, onRoomAction, onSubmitAnswer }: Props) {
  return (
    <div className="modal-backdrop room-backdrop">
      <section className="room-modal">
        <button type="button" className="modal-close" onClick={onLeave}>×</button>

        {!roomView ? (
          <div className="room-wait">
            <span className="eyebrow">ĐANG KẾT NỐI</span>
            <h2>Đang tải phòng chơi…</h2>
          </div>
        ) : (
          <>
            <div className="room-heading" style={{ paddingRight: 24 }}>
              <div>
                <span className="eyebrow">
                  {room.hostKey ? 'BẠN LÀ HOST' : 'PHÒNG CHƠI'} · {PHASE_LABEL[roomView.phase]}
                </span>
                <h2>{roomView.quizTitle}</h2>
              </div>
              <div className="room-pin">
                <small>MÃ PIN</small>
                <b>{roomView.pin}</b>
              </div>
            </div>

            {roomView.phase === 'WAITING' && (
              <div className="lobby-content">
                <div className="lobby-invite">
                  <span>Chia sẻ mã này với người chơi</span>
                  <b>{roomView.pin}</b>
                  <small>Vào quizly và chọn &quot;Nhập mã PIN&quot;</small>
                </div>
                <div className="lobby-players">
                  <div className="room-section-title">NGƯỜI CHƠI <b>{roomView.players.length}</b></div>
                  {roomView.players.length ? (
                    <div className="player-chips">
                      {roomView.players.map((p, i) => <span key={`${p.name}-${i}`}>✳ {p.name}</span>)}
                    </div>
                  ) : <p>Đang chờ người chơi tham gia…</p>}
                </div>
                {room.hostKey ? (
                  <button className="button button-dark room-main-action"
                    onClick={() => void onRoomAction('start', room.hostKey!)}>
                    Bắt đầu trò chơi <span>→</span>
                  </button>
                ) : (
                  <p className="room-hint">Bạn đã vào phòng. Host sẽ bắt đầu ngay khi mọi người sẵn sàng.</p>
                )}
              </div>
            )}

            {roomView.phase === 'FINISHED' && (
              <div className="room-finished">
                <div className="result-icon">🏆</div>
                <span className="eyebrow">BẢNG XẾP HẠNG CUỐI</span>
                <div className="room-leaderboard">
                  {[...roomView.players].sort((a, b) => b.score - a.score).map((p, i) => (
                    <div className="leader-row" key={`${p.name}-${i}`}>
                      <b className="leader-rank">{i + 1}</b>
                      <span>{p.name}</span>
                      <strong>{p.score} điểm</strong>
                    </div>
                  ))}
                </div>
                <button className="button button-dark room-main-action" onClick={onLeave}>Về thư viện</button>
              </div>
            )}

            {(roomView.phase === 'QUESTION' || roomView.phase === 'REVEAL') && (
              <>
                <div className="room-progress">
                  <span>CÂU {String(roomView.questionIndex + 1).padStart(2, '0')} / {String(roomView.questionCount).padStart(2, '0')}</span>
                  <span>{roomView.players.filter(p => p.answered).length}/{roomView.players.length} đã trả lời</span>
                  {secondsLeft !== null && (
                    <b className={secondsLeft <= 5 ? 'room-countdown urgent' : 'room-countdown'}>◷ {secondsLeft}s</b>
                  )}
                </div>

                <h3 className="room-question">{roomView.currentQuestion?.prompt}</h3>

                <div className="room-options">
                  {roomView.currentQuestion?.options.map((opt, i) => {
                    const isReveal = roomView.phase === 'REVEAL';
                    const isPicked = roomView.myAnswerIndex === i;
                    const isCorrect = roomView.currentQuestion?.correctIndex === i;
                    return (
                      <button key={i}
                        disabled={!!room.hostKey || roomView.phase !== 'QUESTION' || roomView.myAnswerIndex !== null}
                        className={`room-option${isReveal && isCorrect ? ' room-correct' : ''}${isPicked && !isCorrect ? ' room-wrong' : ''}${isPicked ? ' room-picked' : ''}`}
                        onClick={() => void onSubmitAnswer(i)}>
                        <span>{String.fromCharCode(65 + i)}</span>
                        {opt}
                        {isReveal && isCorrect && <b>✓</b>}
                        {isPicked && !isReveal && <small>Đã chọn</small>}
                      </button>
                    );
                  })}
                </div>

                {roomView.phase === 'QUESTION' && (
                  room.hostKey ? (
                    <div className="room-host-controls">
                      <p>Người chơi đã trả lời: {roomView.players.filter(p => p.answered).length}/{roomView.players.length}</p>
                      <button className="button button-dark" onClick={() => void onRoomAction('next', room.hostKey!)}>
                        Hiện đáp án <span>→</span>
                      </button>
                    </div>
                  ) : (
                    <p className="room-hint">
                      {roomView.myAnswerIndex !== null
                        ? 'Đã ghi nhận câu trả lời. Chờ host hiện đáp án…'
                        : 'Chọn một đáp án để ghi điểm.'}
                    </p>
                  )
                )}

                {roomView.phase === 'REVEAL' && (
                  <>
                    <div className="room-scoreboard">
                      {[...roomView.players].sort((a, b) => b.score - a.score).slice(0, 5).map((p, i) => (
                        <div className="leader-row" key={`${p.name}-${i}`}>
                          <b className="leader-rank">{i + 1}</b>
                          <span>{p.name}</span>
                          <strong>{p.score} điểm</strong>
                        </div>
                      ))}
                    </div>
                    {room.hostKey && (
                      <button className="button button-dark room-main-action"
                        onClick={() => void onRoomAction('next', room.hostKey!)}>
                        {roomView.questionIndex + 1 === roomView.questionCount ? 'Xem bảng xếp hạng' : 'Câu tiếp theo'} <span>→</span>
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
