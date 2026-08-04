'use client';
import './DetailLoader.css';

// Крутящаяся мишень для лоудеров деталей. Ставится внутрь position:relative блока
// с картинкой/плеером; играет один раз, по onEnded сообщает, что анимация закончилась.
export default function TargetLoader({ onEnded = () => {} }) {
  return (
    <div className="tl-target">
      <video className="tl-video" src="/img/target-loader.mp4" autoPlay muted playsInline aria-hidden="true" onEnded={onEnded}></video>
    </div>
  );
}
