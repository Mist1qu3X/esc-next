'use client';

import { useRef } from 'react';
import './LoadingResults.css';

// Универсальный лоадер страницы: скелет контента + анимация-мишень по центру (без фона).
// Анимация всегда доигрывает до конца: пока данные не готовы (dataReady=false) — крутится в петле,
// как только готовы — доигрывает текущий цикл и вызывает onDone (страница показывает контент).
export default function PageLoader({ variant = 'grid', rows = 8, dataReady = true, onDone = () => {} }) {
  const readyRef = useRef(dataReady);
  readyRef.current = dataReady;
  const videoRef = useRef(null);

  const handleEnded = () => {
    if (readyRef.current) {
      onDone();
    } else if (videoRef.current) {
      try { videoRef.current.currentTime = 0; videoRef.current.play(); } catch (_) { /* noop */ }
    }
  };

  return (
    <div className="pl-page" aria-busy="true" aria-label="Loading">
      <div className="pl-head">
        <span className="pl-subline"></span>
        <span className="pl-title"></span>
      </div>

      <div className={`pl-body pl-${variant}`}>
        {variant === 'detail' ? (
          <>
            <span className="pl-hero"></span>
            <div className="pl-lines">
              <span className="pl-line" style={{ width: '70%' }}></span>
              <span className="pl-line" style={{ width: '92%' }}></span>
              <span className="pl-line" style={{ width: '82%' }}></span>
              <span className="pl-line" style={{ width: '58%' }}></span>
            </div>
          </>
        ) : (
          Array.from({ length: rows }).map((_, i) => <span className="pl-card" key={i}></span>)
        )}
      </div>

      {/* анимация-мишень по центру, без фона (тёмный фон видео убираем блендом) */}
      <div className="pl-loader">
        <video
          ref={videoRef}
          className="lr-video"
          src="/img/target-loader.mp4"
          autoPlay
          muted
          playsInline
          aria-hidden="true"
          onEnded={handleEnded}
        ></video>
      </div>
    </div>
  );
}
