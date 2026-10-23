'use client';
import { useEffect, useRef } from 'react';

// Невидимый маркер в конце списка: когда он подходит к вьюпорту (запас rootMargin),
// зовём onVisible — родитель догружает следующую страницу. Если после догрузки маркер
// всё ещё виден (добавилось мало карточек), родитель меняет key — наблюдатель
// пересоздаётся и срабатывает снова.
export default function LoadMoreSentinel({ onVisible, enabled = true, rootMargin = '800px' }) {
  const ref = useRef(null);
  const cb = useRef(onVisible);
  cb.current = onVisible;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { cb.current?.(); return; }
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) cb.current?.(); },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, rootMargin]);

  return <div ref={ref} aria-hidden="true" style={{ height: 1 }} />;
}
