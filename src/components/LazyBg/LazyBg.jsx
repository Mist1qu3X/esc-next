'use client';
import { useRef, useEffect, useState } from 'react';

// Div с фоновой картинкой, которая подгружается только когда блок подходит к вьюпорту
// (IntersectionObserver, запас 300px). Даёт нативно-ленивую загрузку для фон-картинок,
// которым нельзя loading="lazy". Пропсы className/style/onClick/children пробрасываются.
export default function LazyBg({ src, className = '', style = {}, children, eager = false, ...rest }) {
  const ref = useRef(null);
  const [show, setShow] = useState(eager);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setShow(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  const bg = show && src ? { backgroundImage: `url(${src})` } : undefined;
  return (
    <div ref={ref} className={className} style={bg ? { ...style, ...bg } : style} {...rest}>
      {children}
    </div>
  );
}
