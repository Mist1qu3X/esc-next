'use client';
import './MediaPage.css';

// Лоудер подразделов MEDIA & NEWS: проработанный скелетон-прямоугольниками + анимация-мишень.
// Мишень проигрывается один раз, по onEnded — onDone (снимаем лоудер).
export default function LoadingMedia({ onDone = () => {} }) {
  return (
    <section className="mp-news-content mp-loader-wrap" aria-busy="true" aria-label="Loading">
      {/* FEATURED — крупные карточки */}
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

      {/* Сетка карточек */}
      <div className="mp-section-label" style={{ marginTop: 40 }}><span className="mp-section-line mp-grey"></span><span className="mp-section-text mp-grey-text">LOADING</span></div>
      <div className="mp-latest-news-grid" style={{ marginTop: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
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

      {/* Анимация-мишень поверх скелетона (тёмный фон ролика убираем блендом) */}
      <div className="mp-loader-target">
        <video className="mp-loader-video" src="/img/target-loader.mp4" autoPlay muted playsInline aria-hidden="true" onEnded={onDone}></video>
      </div>
    </section>
  );
}
