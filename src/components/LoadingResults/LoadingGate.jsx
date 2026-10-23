'use client';

import { useState, useEffect } from 'react';
import { installAxiosTracker, pendingCount, onPending } from '@/lib/axiosTracker';

// Держит скелет, пока данные со Strapi не пришли: контент монтируется скрыто и шлёт
// запросы, а скелет убирается, когда сеть «затихла» (нет активных запросов idle мс).
// idle нужен только чтобы «склеить» цепочки запросов (следующий стартует через пару мс
// после ответа предыдущего), поэтому он короткий — каждая лишняя сотня мс тут видна глазом.
export default function LoadingGate({ skeleton, children, minShow = 300, idle = 120, maxWait = 6000 }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    installAxiosTracker();
    const start = Date.now();
    let revealed = false;
    let idleTimer;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      clearTimeout(idleTimer);
      const wait = Math.max(0, minShow - (Date.now() - start));
      setTimeout(() => setLoading(false), wait);
    };

    const onChange = (p) => {
      clearTimeout(idleTimer);
      if (p === 0) idleTimer = setTimeout(reveal, idle); // сеть тихая idle мс -> данные пришли
    };

    const off = onPending(onChange);
    onChange(pendingCount());
    const fallback = setTimeout(reveal, maxWait); // страховка

    return () => { off(); clearTimeout(idleTimer); clearTimeout(fallback); };
  }, [minShow, idle, maxWait]);

  return (
    <>
      {loading && skeleton}
      <div style={loading ? { display: 'none' } : undefined}>{children}</div>
    </>
  );
}
