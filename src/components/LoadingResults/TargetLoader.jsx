'use client';
import { useEffect } from 'react';
import './DetailLoader.css';

// Лоудер деталей: затемнение всего экрана (tl-dim) + мишень по центру экрана (tl-target).
// ВАЖНО: у tl-target НЕ должно быть позиционированных/opacity/transform/z-index/fixed предков —
// тогда absolute считается от initial containing block (= вьюпорт, центр экрана на загрузке),
// а mix-blend-mode: screen реально выбивает чёрный фон ролика (никакого прямоугольника).
// Затемнение — отдельный СИБЛИНГ (fixed), поэтому оно не ломает блендинг мишени.
export default function TargetLoader({ onEnded = () => {} }) {
  // Подстраховка: если ролик не запустится / не эмитит ended (автоплей заблокирован,
  // энергосбережение на мобильном, ошибка декодинга) — всё равно снимаем лоадер через таймаут,
  // иначе страница навсегда зависнет на скелетоне.
  useEffect(() => {
    const t = setTimeout(() => onEnded(), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div className="tl-dim" aria-hidden="true"></div>
      <div className="tl-target">
        <video className="tl-video" src="/img/target-loader.mp4" autoPlay muted playsInline aria-hidden="true" onEnded={onEnded} onError={onEnded}></video>
      </div>
    </>
  );
}
