'use client';
import { useEffect } from 'react';
import './DetailLoader.css';

// Лоудер деталей: затемнение всего экрана (tl-dim) + мишень по центру экрана (tl-target).
// ВАЖНО: у tl-target НЕ должно быть позиционированных/opacity/transform/z-index/fixed предков —
// тогда absolute считается от initial containing block (= вьюпорт, центр экрана на загрузке),
// а mix-blend-mode: screen реально выбивает чёрный фон ролика (никакого прямоугольника).
// Затемнение — отдельный СИБЛИНГ (fixed), поэтому оно не ломает блендинг мишени.
export default function TargetLoader({ onEnded = () => {}, minShow = 500 }) {
  // Лоадер не должен задерживать готовую страницу: через minShow (чтобы мишень не мигала
  // на быстрых загрузках) сообщаем родителю, что можно показывать контент, как только он
  // загружен. Если данные идут дольше — ролик (2.8 с) доигрывает сам, onEnded с <video>
  // остаётся на случай, если его хотят дождаться. Таймаут также страхует от незапустившегося
  // ролика (автоплей заблокирован, энергосбережение, ошибка декодинга).
  useEffect(() => {
    const t = setTimeout(() => onEnded(), minShow);
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
