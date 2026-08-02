'use client';

import './LoadingResults.css';

// Скелет списка соревнований (Level 1 Results): фильтры-прямоугольники + пустые карточки ивентов
export default function SkeletonEvents() {
  return (
    <div className="sk-events" aria-busy="true" aria-label="Loading competitions">
      <div className="sk-filter-bar">
        <div className="sk-filter-left">
          <span className="sk-filter-box" style={{ width: 120 }}></span>
          <span className="sk-filter-box" style={{ width: 150 }}></span>
          <span className="sk-filter-box" style={{ width: 150 }}></span>
        </div>
        <div className="sk-filter-right"><span className="sk-filter-box" style={{ width: 110 }}></span></div>
      </div>

      <div className="sk-events-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="sk-event-card" key={i}>
            <div className="sk-ec-left">
              <div className="sk-ec-tags">
                <span className="sk-chip" style={{ width: 80 }}></span>
                <span className="sk-chip" style={{ width: 62 }}></span>
                <span className="sk-chip" style={{ width: 46 }}></span>
              </div>
              <span className="sk-ec-title" style={{ width: `${50 + (i % 3) * 12}%` }}></span>
              <div className="sk-ec-meta">
                <span className="sk-bar" style={{ width: 140 }}></span>
                <span className="sk-bar" style={{ width: 120 }}></span>
              </div>
            </div>
            <div className="sk-ec-right"><span className="sk-btn"></span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
