import type { GameHistory } from '../../lib/types';

type Props = {
  history: GameHistory[];
  loading: boolean;
  onClose: () => void;
};

const fmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export default function HistoryModal({ history, loading, onClose }: Props) {
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="history-modal">
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <span className="eyebrow">TỔNG KẾT CÁC PHÒNG BẠN HOST</span>
        <h2>Lịch sử chơi <em>✳</em></h2>

        {loading ? (
          <p className="history-empty">Đang tải kết quả…</p>
        ) : history.length === 0 ? (
          <div className="history-empty">
            <div className="empty-icon">🏆</div>
            <h3>Chưa có kết quả nào</h3>
            <p>Kết quả sẽ xuất hiện ở đây sau khi một phòng chơi kết thúc.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map(game => (
              <article className="history-card" key={game.id}>
                <div className="history-card-head">
                  <div>
                    <span className="history-date">{fmt.format(new Date(game.completedAt))}</span>
                    <h3>{game.quizTitle}</h3>
                  </div>
                  <span className="history-pin">PIN {game.pin}</span>
                </div>
                <p>{game.playerCount} người chơi · {game.questionCount} câu hỏi</p>
                <div className="history-winners">
                  {game.players.slice(0, 3).map(p => (
                    <span key={p.rank}><b>{p.rank}.</b> {p.name} <strong>{p.score} điểm</strong></span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
