'use client';

import './LoadingResults.css';

// Скелет таблицы результатов + анимация-мишень по центру (пока грузится контент)
const ROWS = [176, 150, 158, 158, 130, 176, 158, 180]; // ширины плашек-имён, как на макете

export default function LoadingResults() {
  return (
    <section className="lr-section" aria-busy="true" aria-label="Loading results">
      <div className="lr-subtitle"><span className="lr-subline"></span>ESC RESULTS</div>
      <div className="lr-title-bar"></div>
      <div className="lr-crumbs">
        <span className="lr-crumb" style={{ width: 46 }}></span><span className="lr-crumb-sep">›</span>
        <span className="lr-crumb" style={{ width: 92 }}></span><span className="lr-crumb-sep">›</span>
        <span className="lr-crumb" style={{ width: 78 }}></span>
      </div>

      <div className="lr-table">
        <div className="lr-head">
          <span className="lr-h lr-h-rank">RANK</span>
          <span className="lr-h lr-h-athlete">ATHLETE</span>
          <span className="lr-h lr-h-fed">FED</span>
          <span className="lr-h lr-h-series">SERIES (SHOT BY SHOT)</span>
          <span className="lr-h lr-h-total">TOTAL</span>
          <span className="lr-h lr-h-inner">INNER 10S</span>
        </div>

        <div className="lr-body">
          {ROWS.map((w, i) => (
            <div className="lr-row" key={i}>
              <span className="lr-rank">
                {i < 3
                  ? <img className="lr-medal" src={`/img/${['First', 'Second', 'Third'][i]}_results.png`} alt="" />
                  : <span className="lr-num">{i + 1}</span>}
              </span>
              <span className="lr-athlete" style={{ width: w }}></span>
              <span className="lr-fed"></span>
              <span className="lr-series">
                <span className="lr-series-line">{Array.from({ length: 10 }).map((_, k) => <span className="lr-dash" key={k}></span>)}</span>
                <span className="lr-series-line">{Array.from({ length: 10 }).map((_, k) => <span className="lr-dash" key={k}></span>)}</span>
              </span>
              <span className="lr-total"></span>
              <span className="lr-inner"></span>
            </div>
          ))}

          {/* анимация-мишень по центру, без фона (тёмный фон видео убираем блендом) */}
          <div className="lr-loader">
            <video className="lr-video" src="/img/target-loader.mp4" autoPlay loop muted playsInline aria-hidden="true"></video>
          </div>
        </div>
      </div>
    </section>
  );
}
