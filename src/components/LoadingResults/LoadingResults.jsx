'use client';

import './LoadingResults.css';

// Скелет таблицы + анимация-мишень по центру (пока грузится 3 уровень).
// variant подстраивает подзаголовок и колонки под results / ranking / records.
const ROWS = [176, 150, 158, 158, 130, 176, 158, 180]; // ширины плашек-имён

const VARIANTS = {
  results: { subtitle: 'ESC RESULTS', cols: ['RANK', 'ATHLETE', 'FED', 'SERIES (SHOT BY SHOT)', 'TOTAL', 'INNER 10S'], series: true },
  ranking: { subtitle: 'ESC SEASON RANKING', cols: ['RANK', 'ATHLETE', 'FED', 'POINTS', 'EVENTS', 'BEST'], series: false },
  records: { subtitle: 'ESC SEASON RECORDS', cols: ['TYPE', 'ATHLETE', 'FED', 'RECORD', 'LOCATION', 'DATE'], series: false },
};

export default function LoadingResults({ variant = 'results', onDone = () => {} }) {
  const v = VARIANTS[variant] || VARIANTS.results;

  return (
    <section className="lr-section" aria-busy="true" aria-label="Loading">
      <div className="lr-subtitle"><span className="lr-subline"></span>{v.subtitle}</div>
      <div className="lr-title-bar"></div>
      <div className="lr-crumbs">
        <span className="lr-crumb" style={{ width: 46 }}></span><span className="lr-crumb-sep">›</span>
        <span className="lr-crumb" style={{ width: 92 }}></span><span className="lr-crumb-sep">›</span>
        <span className="lr-crumb" style={{ width: 78 }}></span>
      </div>

      <div className="lr-table">
        <div className="lr-head">
          {v.cols.map((c, i) => <span className={`lr-h lr-h-${i}`} key={i}>{c}</span>)}
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
              {v.series ? (
                <span className="lr-series">
                  <span className="lr-series-line">{Array.from({ length: 10 }).map((_, k) => <span className="lr-dash" key={k}></span>)}</span>
                  <span className="lr-series-line">{Array.from({ length: 10 }).map((_, k) => <span className="lr-dash" key={k}></span>)}</span>
                </span>
              ) : (
                <span className="lr-wide-box"></span>
              )}
              <span className="lr-total"></span>
              <span className="lr-inner"></span>
            </div>
          ))}

          {/* анимация-мишень по центру, без фона (тёмный фон видео убираем блендом) */}
          <div className="lr-loader">
            <video className="lr-video" src="/img/target-loader.mp4" autoPlay muted playsInline aria-hidden="true" onEnded={onDone}></video>
          </div>
        </div>
      </div>
    </section>
  );
}
