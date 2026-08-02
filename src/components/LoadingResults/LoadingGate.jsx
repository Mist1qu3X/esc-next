'use client';

import { useState, useEffect } from 'react';

// Показывает скелет блоков, затем реальный контент (для страниц из многих компонентов — Home, About).
export default function LoadingGate({ skeleton, children, delay = 750 }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return loading ? skeleton : children;
}
