'use client';

import './LoadingResults.css';

// Детальный скелет About Us (в контейнере 1440): герой + статы + секция + сетка федераций
export default function AboutSkeleton() {
  return (
    <div className="pg-skel" aria-busy="true" aria-label="Loading">
      <div className="pg-skel-wrap">
        {/* HERO */}
        <div className="pg-skel-hero">
          <div className="skeleton" style={{ position: 'absolute', inset: 0 }}></div>
          <div className="pg-skel-hero-inner">
            <span className="skel-bright" style={{ width: 120, height: 16 }}></span>
            <span className="skel-bright" style={{ width: '58%', height: 34, marginTop: 16 }}></span>
            <span className="skel-bright" style={{ width: '42%', height: 34, marginTop: 10 }}></span>
            <span className="skel-bright" style={{ width: '70%', height: 13, marginTop: 22 }}></span>
            <span className="skel-bright" style={{ width: '55%', height: 13, marginTop: 8 }}></span>
          </div>
        </div>

        {/* статы */}
        <div className="pg-skel-stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="pg-skel-stat skeleton-card" key={i}>
              <div className="skeleton" style={{ width: 64, height: 30, borderRadius: 4 }}></div>
              <div className="skeleton" style={{ width: 96, height: 12, borderRadius: 3, marginTop: 12 }}></div>
            </div>
          ))}
        </div>

        {/* заголовок секции + ссылка */}
        <div className="pg-skel-sec-head">
          <div className="skeleton" style={{ width: 300, height: 26, borderRadius: 6 }}></div>
          <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 3 }}></div>
        </div>
        {/* фильтр-табы */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          {Array.from({ length: 5 }).map((_, i) => <div className="skeleton" key={i} style={{ width: 90, height: 30, borderRadius: 4 }}></div>)}
        </div>
        {/* сетка федераций */}
        <div className="pg-skel-grid" style={{ marginTop: 18 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="pg-skel-fed skeleton-card" key={i}>
              <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 8, flexShrink: 0 }}></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="skeleton" style={{ width: '82%', height: 15, borderRadius: 3 }}></div>
                <div className="skeleton" style={{ width: '46%', height: 11, borderRadius: 3, marginTop: 9 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
