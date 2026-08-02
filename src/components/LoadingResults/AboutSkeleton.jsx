'use client';

import './LoadingResults.css';

// Скелет About Us: герой + блок текста + сетка карточек федераций
export default function AboutSkeleton() {
  return (
    <div className="pg-skel" aria-busy="true" aria-label="Loading">
      <div className="pg-skel-hero skeleton"></div>

      <div className="pg-skel-wrap">
        <div className="skeleton" style={{ width: 260, height: 26, borderRadius: 6, marginTop: 40 }}></div>
        <div className="skeleton" style={{ width: '92%', height: 14, borderRadius: 4, marginTop: 18 }}></div>
        <div className="skeleton" style={{ width: '85%', height: 14, borderRadius: 4, marginTop: 8 }}></div>
        <div className="skeleton" style={{ width: '78%', height: 14, borderRadius: 4, marginTop: 8 }}></div>

        <div className="skeleton" style={{ width: 220, height: 22, borderRadius: 5, marginTop: 48 }}></div>
        <div className="pg-skel-grid" style={{ marginTop: 18 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="pg-skel-fed skeleton-card" key={i}>
              <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 8 }}></div>
              <div className="skeleton" style={{ width: '70%', height: 15, borderRadius: 3, marginTop: 14 }}></div>
              <div className="skeleton" style={{ width: '45%', height: 12, borderRadius: 3, marginTop: 8 }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
