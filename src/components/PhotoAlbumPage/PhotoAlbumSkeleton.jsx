'use client';
import TargetLoader from '@/components/LoadingResults/TargetLoader';
import './PhotoAlbumPage.css';

// Скелет открытого альбома: шапка + большой вьюер + сетка миниатюр.
// Мишень — сиблингом (не внутри пульсирующих .ds-block), по центру экрана.
export default function PhotoAlbumSkeleton({ onEnded = () => {} }) {
  return (
    <>
      <section className="pa-header">
        <div className="pa-breadcrumbs">
          <span className="skeleton" style={{ width: 40, height: 12, borderRadius: 3 }}></span>
          <span className="pa-crumb-sep">›</span>
          <span className="skeleton" style={{ width: 48, height: 12, borderRadius: 3 }}></span>
          <span className="pa-crumb-sep">›</span>
          <span className="skeleton" style={{ width: 160, height: 12, borderRadius: 3 }}></span>
        </div>
        <div className="skeleton" style={{ width: '46%', height: 34, borderRadius: 4, marginTop: 14 }}></div>
      </section>

      <section className="pa-content">
        <div className="pa-viewer ds-block" style={{ aspectRatio: '16 / 9' }}></div>

        <div className="pa-all-label" style={{ opacity: 0.4 }}>ALL PHOTO</div>
        <div className="pa-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="pa-thumb ds-block"></div>
          ))}
        </div>
      </section>

      <TargetLoader onEnded={onEnded} />
    </>
  );
}
