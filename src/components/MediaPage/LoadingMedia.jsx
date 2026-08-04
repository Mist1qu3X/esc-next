'use client';
import './MediaPage.css';

// Лоудер подразделов MEDIA & NEWS: скелетон повторяет раскладку конкретной вкладки
// + анимация-мишень поверх. Ролик играет один раз, по onEnded — onDone.
//   variant: 'photo' | 'video' | 'press' | 'articles'

const Target = ({ onDone }) => (
  <div className="mp-loader-target">
    <video className="mp-loader-video" src="/img/target-loader.mp4" autoPlay muted playsInline aria-hidden="true" onEnded={onDone}></video>
  </div>
);

// Сетка карточек-обложек (PHOTO / VIDEOS)
function GridSkeleton({ heading, video }) {
  return (
    <div>
      <h2 className="mp-photo-heading">{heading}</h2>
      <div className="mp-photo-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="mp-photo-card" key={i}>
            <div className={`${video ? 'mp-vgal-cover' : 'mp-photo-cover'} skeleton`}></div>
            <div className="mp-photo-panel">
              <div className="skeleton" style={{ width: '82%', height: 15, borderRadius: 3 }}></div>
              <div className="mp-photo-footer">
                <span className="skeleton" style={{ width: 64, height: 11, borderRadius: 3 }}></span>
                {!video && <span className="skeleton" style={{ width: 30, height: 11, borderRadius: 3 }}></span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Список пресс-релизов
function PressSkeleton() {
  return (
    <div>
      <div className="mp-section-header">
        <div className="mp-section-label">
          <span className="mp-section-line mp-grey"></span>
          <span className="mp-section-text mp-grey-text">PRESS RELEASES</span>
        </div>
      </div>
      <div className="mp-press-divider"></div>
      <div className="mp-press-list">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="mp-press-item" key={i}>
            <div className="mp-press-info" style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '58%', height: 16, borderRadius: 3 }}></div>
              <div className="skeleton" style={{ width: '88%', height: 12, borderRadius: 3, marginTop: 10 }}></div>
              <div className="skeleton" style={{ width: 130, height: 11, borderRadius: 3, marginTop: 10 }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Featured + сетка новостей (ALL / NEWS / FEATURES / INTERVIEWS)
function ArticlesSkeleton() {
  return (
    <>
      <div className="mp-section-label"><span className="mp-section-line mp-blue"></span><span className="mp-section-text">FEATURED</span></div>
      <div className="mp-featured-container" style={{ marginTop: 16 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div className="mp-featured-card skeleton-card" key={i} style={{ aspectRatio: '687 / 386', position: 'relative', overflow: 'hidden', borderRadius: 4 }}>
            <div className="skeleton" style={{ position: 'absolute', inset: 0 }}></div>
            <div className="mp-featured-overlay" style={{ zIndex: 1 }}>
              <span className="skel-bright" style={{ width: 100, height: 20 }}></span>
              <div className="skel-bright" style={{ width: '78%', height: 26, marginTop: 14 }}></div>
              <div className="skel-bright" style={{ width: '52%', height: 26, marginTop: 8 }}></div>
              <div className="mp-featured-footer" style={{ marginTop: 18 }}>
                <span className="skel-bright" style={{ width: 90, height: 14 }}></span>
                <span className="skel-bright" style={{ width: 100, height: 14 }}></span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mp-section-label" style={{ marginTop: 40 }}><span className="mp-section-line mp-grey"></span><span className="mp-section-text mp-grey-text">LATEST NEWS</span></div>
      <div className="mp-latest-news-grid" style={{ marginTop: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="mp-news-card skeleton-card" key={i}>
            <div className="mp-news-card-image skeleton"></div>
            <div className="mp-news-card-content">
              <div className="skeleton" style={{ width: 70, height: 16, borderRadius: 3 }}></div>
              <div className="skeleton" style={{ width: '92%', height: 15, borderRadius: 3, marginTop: 12 }}></div>
              <div className="skeleton" style={{ width: '72%', height: 15, borderRadius: 3, marginTop: 6 }}></div>
              <div className="skeleton" style={{ width: 90, height: 12, borderRadius: 3, marginTop: 14 }}></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function LoadingMedia({ variant = 'articles', onDone = () => {} }) {
  return (
    <section className="mp-news-content mp-loader-wrap" aria-busy="true" aria-label="Loading">
      {variant === 'photo' && <GridSkeleton heading="PHOTO" />}
      {variant === 'video' && <GridSkeleton heading="VIDEOS" video />}
      {variant === 'press' && <PressSkeleton />}
      {variant === 'articles' && <ArticlesSkeleton />}
      <Target onDone={onDone} />
    </section>
  );
}
