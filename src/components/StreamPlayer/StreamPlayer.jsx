'use client';

import './StreamPlayer.css';

// Достаём videoId из разных форм YouTube-ссылки
function ytId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Строим embed-URL. YouTube-плеер сам показывает эфир/премьеру/запись — «статус» подтягивается автоматически.
// Без API-ключа: играем конкретное видео по ссылке, либо (если дан канал) — текущий лайв канала.
export function getEmbedUrl(stream) {
  const url = stream?.url || '';
  const p = (stream?.platform || '').toLowerCase();
  if (p.includes('youtube') || url.includes('youtu')) {
    const id = ytId(url);
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    const ch = url.match(/youtube\.com\/channel\/([\w-]+)/);
    if (ch) return `https://www.youtube.com/embed/live_stream?channel=${ch[1]}&autoplay=1`;
    return null;
  }
  if (p.includes('facebook') || url.includes('facebook')) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true&width=1280`;
  }
  return null;
}

// Есть ли что встроить (иначе кнопка «play» просто откроет платформу)
export function canEmbed(stream) {
  return !!getEmbedUrl(stream);
}

export default function StreamPlayer({ stream, onClose }) {
  if (!stream) return null;
  const embed = getEmbedUrl(stream);
  const live = (stream.streamStatus || '').toLowerCase() === 'live';

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sp-close" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {embed ? (
          <div className="sp-frame">
            <iframe
              src={embed}
              title={stream.title || 'Live stream'}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              frameBorder="0"
            ></iframe>
          </div>
        ) : (
          <div className="sp-fallback">
            <i className="fa-regular fa-circle-play sp-fallback-icon"></i>
            <p className="sp-fallback-text">This stream plays on {stream.platform || 'the platform'}.</p>
            <a className="sp-fallback-btn" href={stream.url} target="_blank" rel="noreferrer">
              Open stream <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>
        )}

        <div className="sp-caption">
          <span className={`sp-badge ${live ? 'sp-live' : 'sp-upcoming'}`}>
            <span className="sp-badge-dot"></span>{live ? 'LIVE' : 'UPCOMING'}
          </span>
          <span className="sp-title">{stream.title}</span>
        </div>
      </div>
    </div>
  );
}
