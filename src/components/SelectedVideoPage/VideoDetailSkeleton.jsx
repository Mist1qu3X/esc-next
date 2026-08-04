'use client';
import TargetLoader from '@/components/LoadingResults/TargetLoader';
import './SelectedVideoPage.css';

// Скелет открытого видео: шапка + большой плеер (мишень по центру) + сетка «MORE VIDEOS».
export default function VideoDetailSkeleton({ onEnded = () => {} }) {
  return (
    <>
      <section className="sv-header">
        <div className="sv-breadcrumbs">
          <span className="skeleton" style={{ width: 40, height: 12, borderRadius: 3 }}></span>
          <span className="sv-crumb-sep">›</span>
          <span className="skeleton" style={{ width: 48, height: 12, borderRadius: 3 }}></span>
          <span className="sv-crumb-sep">›</span>
          <span className="skeleton" style={{ width: 160, height: 12, borderRadius: 3 }}></span>
        </div>
        <div className="skeleton" style={{ width: '46%', height: 34, borderRadius: 4, marginTop: 14 }}></div>
      </section>

      <section className="sv-content">
        <div className="ds-block" style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 6, overflow: 'hidden' }}>
          <TargetLoader onEnded={onEnded} />
        </div>

        <div className="sv-more-label" style={{ opacity: 0.4 }}>MORE VIDEOS</div>
        <div className="sv-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="sv-card">
              <div className="sv-card-cover ds-block"></div>
              <div className="sv-card-panel">
                <div className="skeleton" style={{ width: '82%', height: 14, borderRadius: 3 }}></div>
                <div className="skeleton" style={{ width: 70, height: 11, borderRadius: 3, marginTop: 10 }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
