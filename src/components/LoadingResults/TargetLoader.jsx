'use client';
import './DetailLoader.css';

// Крутящаяся мишень для лоудеров деталей. Ставится внутрь position:relative блока
// с картинкой/плеером; играет один раз, по onEnded сообщает, что анимация закончилась.
// Тёмный «ореол» под роликом гарантирует, что его чёрный фон сливается (не зависит
// от mix-blend-mode, который на <video> срабатывает не везде).
export default function TargetLoader({ onEnded = () => {}, screen = false }) {
  return (
    <div className={`tl-target${screen ? ' tl-screen' : ''}`}>
      <div className="tl-halo">
        <video className="tl-video" src="/img/target-loader.mp4" autoPlay muted playsInline aria-hidden="true" onEnded={onEnded}></video>
      </div>
    </div>
  );
}
