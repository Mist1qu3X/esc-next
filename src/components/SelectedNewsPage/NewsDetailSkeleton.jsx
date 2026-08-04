'use client';
import TargetLoader from '@/components/LoadingResults/TargetLoader';
import './SelectedNewsPage.css';

// Скелет открытой новости: герой + тело статьи + сайдбар.
// Мишень — сиблингом (не внутри пульсирующего .ds-block), по центру экрана.
export default function NewsDetailSkeleton({ onEnded = () => {} }) {
  return (
    <div style={{ position: 'relative' }}>
      <section className="selected_media_head ds-block">
        <div className="selected-media-content">
          <div className="selected-meta-row">
            <span className="skel-bright" style={{ width: 70, height: 18 }}></span>
            <span className="skel-bright" style={{ width: 96, height: 14 }}></span>
          </div>
          <div className="skel-bright" style={{ width: '68%', height: 38, marginTop: 16 }}></div>
          <div className="skel-bright" style={{ width: '44%', height: 38, marginTop: 10 }}></div>
          <div className="selected-info-row" style={{ marginTop: 18, display: 'flex', gap: 14 }}>
            <span className="skel-bright" style={{ width: 120, height: 14 }}></span>
            <span className="skel-bright" style={{ width: 150, height: 14 }}></span>
          </div>
        </div>
      </section>

      <section className="media_main_content">
        <div className="media-content-wrapper">
          <div className="media-article-body" style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '85%', height: 22, borderRadius: 3, marginBottom: 24 }}></div>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 13, borderRadius: 3, marginBottom: 12, width: i % 4 === 3 ? '55%' : '100%' }}></div>
            ))}
          </div>

          <aside className="media-sidebar">
            {Array.from({ length: 3 }).map((_, b) => (
              <div key={b} className="sidebar-block">
                <div className="skeleton" style={{ width: 130, height: 13, borderRadius: 3 }}></div>
                <div className="skeleton" style={{ width: '100%', height: 64, borderRadius: 4, marginTop: 14 }}></div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <TargetLoader onEnded={onEnded} />
    </div>
  );
}
