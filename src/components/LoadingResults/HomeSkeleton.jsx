'use client';

import './LoadingResults.css';

// Скелет главной: полноширинный герой + широкий блок + ряд новостных карточек
export default function HomeSkeleton() {
  return (
    <div className="pg-skel" aria-busy="true" aria-label="Loading">
      <div className="pg-skel-hero skeleton"></div>

      <div className="pg-skel-wrap">
        <div className="skeleton" style={{ height: 360, borderRadius: 10, marginTop: 28 }}></div>

        <div className="skeleton" style={{ width: 200, height: 22, borderRadius: 5, marginTop: 44 }}></div>
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
