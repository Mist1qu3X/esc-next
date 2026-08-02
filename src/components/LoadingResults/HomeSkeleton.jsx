'use client';

import './LoadingResults.css';

// Детальный скелет главной (в контейнере 1440): герой + блок FullInfo + новости
export default function HomeSkeleton() {
  return (
    <div className="pg-skel" aria-busy="true" aria-label="Loading">
      <div className="pg-skel-wrap">
        {/* HERO (Info) */}
        <div className="pg-skel-hero">
          <div className="skeleton" style={{ position: 'absolute', inset: 0 }}></div>
          <div className="pg-skel-hero-inner">
            <span className="skel-bright" style={{ width: 130, height: 16 }}></span>
            <span className="skel-bright" style={{ width: '62%', height: 34, marginTop: 16 }}></span>
            <span className="skel-bright" style={{ width: '44%', height: 34, marginTop: 10 }}></span>
            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
              <span className="skel-bright" style={{ width: 150, height: 14 }}></span>
              <span className="skel-bright" style={{ width: 120, height: 14 }}></span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
              <span className="skel-bright" style={{ width: 160, height: 44, borderRadius: 4 }}></span>
              <span className="skel-bright" style={{ width: 140, height: 44, borderRadius: 4 }}></span>
            </div>
          </div>
        </div>

        {/* FullInfo: обратный отсчёт + рейтинг + кнопка */}
        <div className="pg-skel-panel skeleton-card">
          <div className="pg-skel-panel-top">
            <div style={{ display: 'flex', gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => <div className="skeleton" key={i} style={{ width: 70, height: 70, borderRadius: 6 }}></div>)}
            </div>
            <div className="skeleton" style={{ width: 170, height: 42, borderRadius: 4 }}></div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="skeleton" style={{ width: 22, height: 16, borderRadius: 3 }}></div>
                <div className="skeleton" style={{ width: `${38 + (i % 3) * 12}%`, height: 14, borderRadius: 3 }}></div>
                <div className="skeleton" style={{ width: 54, height: 14, borderRadius: 3, marginLeft: 'auto' }}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Новости */}
        <div className="skeleton" style={{ width: 200, height: 20, borderRadius: 4, marginTop: 44 }}></div>
        <div className="pg-skel-row" style={{ marginTop: 18 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="pg-skel-card skeleton-card" key={i}>
              <div className="skeleton" style={{ height: 180 }}></div>
              <div style={{ padding: 16 }}>
                <div className="skeleton" style={{ width: 70, height: 15, borderRadius: 3 }}></div>
                <div className="skeleton" style={{ width: '90%', height: 16, borderRadius: 3, marginTop: 12 }}></div>
                <div className="skeleton" style={{ width: '65%', height: 16, borderRadius: 3, marginTop: 6 }}></div>
                <div className="skeleton" style={{ width: 90, height: 12, borderRadius: 3, marginTop: 14 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
