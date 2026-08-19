'use client';
import './Pagination.css';

// Единая пагинация.
// Десктоп/планшет: PREV  1 … (cur-1) cur (cur+1) … last  NEXT
// Мобильные: ровно 3 «кубика» с числами — окно, центрированное на текущей странице.
export default function Pagination({ page, pageCount, onChange }) {
  if (!pageCount || pageCount <= 1) return null;

  const win = [1];
  if (page - 1 > 2) win.push('…');
  for (let p = Math.max(2, page - 1); p <= Math.min(pageCount - 1, page + 1); p++) win.push(p);
  if (page + 1 < pageCount - 1) win.push('…');
  win.push(pageCount);

  // Компактное окно из 3 чисел: центр — текущая, у краёв прижимается (1 2 3 … last-2 last-1 last).
  const start = Math.min(Math.max(1, page - 1), Math.max(1, pageCount - 2));
  const compact = [];
  for (let p = start; p < start + 3 && p <= pageCount; p++) compact.push(p);

  const go = (p) => { if (p >= 1 && p <= pageCount && p !== page) onChange(p); };

  return (
    <div className="pgn">
      {/* Десктоп/планшет — полная пагинация */}
      <div className="pgn-full">
        <button className="pgn-btn pgn-nav" disabled={page === 1} onClick={() => go(page - 1)}>&lt; PREV</button>
        {win.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="pgn-ellipsis">…</span>
            : <button key={p} className={`pgn-btn ${p === page ? 'active' : ''}`} onClick={() => go(p)}>{p}</button>
        )}
        <button className="pgn-btn pgn-nav" disabled={page === pageCount} onClick={() => go(page + 1)}>NEXT &gt;</button>
      </div>
      {/* Мобильные — 3 кубика с числами */}
      <div className="pgn-compact">
        {compact.map((p) =>
          <button key={p} className={`pgn-btn ${p === page ? 'active' : ''}`} onClick={() => go(p)}>{p}</button>
        )}
      </div>
    </div>
  );
}
