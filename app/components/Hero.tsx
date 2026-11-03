type Props = { quizCount: number; onCreateQuiz: () => void };

export default function Hero({ quizCount, onCreateQuiz }: Props) {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow"><span className="live-dot" /> HỌC VUI, NHỚ LÂU</span>
        <h1>Kiến thức hay.<br /><em>Cuộc chơi vui.</em></h1>
        <p>Khám phá những quiz thú vị hoặc tự tạo một bộ câu hỏi cho bạn bè, lớp học và cộng đồng.</p>
        <div className="hero-actions">
          <a className="button button-lime" href="#discover">Khám phá quiz <span>↗</span></a>
          <button className="button button-outline" onClick={onCreateQuiz}>Tạo quiz của bạn</button>
        </div>
        <div className="social-proof">
          <div className="avatar-stack">
            <i>🧑🏻</i><i>👩🏽</i><i>👨🏻</i><i>👩🏼</i>
          </div>
          <span><b>{quizCount || '—'}</b> quiz đang chờ bạn khám phá</span>
        </div>
      </div>
      <div className="hero-art">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="spark spark-a">✳</div>
        <div className="spark spark-b">✦</div>
        <div className="quiz-paper">
          <div className="paper-top"><span>✳ QUIZ OF THE DAY</span><span>•••</span></div>
          <div className="paper-icon">🌍</div>
          <h3>Bạn biết gì về<br />thế giới quanh ta?</h3>
          <div className="paper-meta"><span>◷ 5 phút</span><span>✦ 8 câu hỏi</span></div>
          <div className="paper-progress"><i /></div>
        </div>
        <div className="float-badge badge-streak">🔥 <b>7 ngày</b><small>chuỗi học tập</small></div>
        <div className="float-badge badge-score"><span>⭐</span><b>+250 XP</b><small>điểm hôm nay</small></div>
      </div>
    </section>
  );
}
