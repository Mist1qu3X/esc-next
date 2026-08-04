'use client';
import './DetailLoader.css';

// Крутящаяся мишень для лоудеров деталей. Центрируется по первому экрану.
// ВАЖНО: у предков не должно быть opacity/transform/filter/z-index/fixed —
// иначе создаётся stacking context и mix-blend-mode: screen перестаёт «выбивать»
// чёрный фон ролика. Поэтому мишень кладём СИБЛИНГОМ к пульсирующим блокам,
// а не внутрь них.
export default function TargetLoader({ onEnded = () => {} }) {
  return (
    <div className="tl-target">
      <video className="tl-video" src="/img/target-loader.mp4" autoPlay muted playsInline aria-hidden="true" onEnded={onEnded}></video>
    </div>
  );
}
