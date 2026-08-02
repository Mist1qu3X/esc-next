'use client';

import './LoadingResults.css';

// Скелет загрузки страницы БЕЗ анимации (крутилка-мишень живёт только в Results).
// withHeader=false — когда ставим скелет под настоящую блок-шапку страницы.
export default function PageLoader({ variant = 'grid', rows = 8, withHeader = true }) {
  return (
    <div className={`pl-page ${withHeader ? '' : 'pl-nohead'}`} aria-busy="true" aria-label="Loading">
      {withHeader && (
        <div className="pl-head">
          <span className="pl-subline"></span>
          <span className="pl-title"></span>
        </div>
      )}

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
    </div>
  );
}
