'use client';
import { useState, useRef, useEffect } from 'react';
import './VideoPlayer.css';

const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// Достаём id ролика из embed-ссылки (…/embed/ID) или обычной ссылки
const extractYtId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : null;
};

// Одноразовая загрузка YouTube IFrame API (нужна, чтобы ловить onError)
let ytApiPromise = null;
const loadYtApi = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof prev === 'function') prev(); resolve(window.YT); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
};

// Плеер YouTube через IFrame API — он умеет отдавать onError, когда владелец
// запретил встраивание (коды 101/150) или ролик недоступен (100): тогда вместо
// ошибки показываем ссылку «смотреть на YouTube». Если API не поднялся вовремя —
// откатываемся на обычный iframe (поведение как раньше, не хуже).
const YouTubePlayer = ({ videoId, embedUrl }) => {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [state, setState] = useState('loading'); // loading | ok | blocked | fallback

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    let settled = false;
    const settle = (s) => { if (!cancelled && !settled) { settled = true; setState(s); } };
    const destroy = () => { try { playerRef.current?.destroy?.(); } catch (_) {} };

    // Если плеер не инициализировался за 5с — показываем обычный iframe
    const timer = setTimeout(() => { destroy(); settle('fallback'); }, 5000);

    loadYtApi()
      .then((YT) => {
        if (cancelled || !YT || !hostRef.current) return;
        playerRef.current = new YT.Player(hostRef.current, {
          videoId,
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: () => { clearTimeout(timer); settle('ok'); },
            onError: (e) => {
              clearTimeout(timer);
              if ([100, 101, 150].includes(e.data)) { destroy(); settle('blocked'); }
              else settle('ok');
            },
          },
        });
      })
      .catch(() => { clearTimeout(timer); settle('fallback'); });

    return () => { cancelled = true; clearTimeout(timer); destroy(); };
  }, [videoId]);

  if (state === 'blocked') {
    return (
      <div className="vp-wrap vp-blocked">
        <i className="fa-brands fa-youtube vp-blocked-icon"></i>
        <p className="vp-blocked-text">The owner has disabled playback of this video on other sites.</p>
        <a
          className="vp-blocked-btn"
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-youtube"></i> Watch on YouTube
        </a>
      </div>
    );
  }

  if (state === 'fallback') {
    return (
      <>
        <div className="vp-wrap">
          <iframe
            className="vp-iframe"
            src={embedUrl}
            title="video"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <a
          className="vp-yt-link"
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa-brands fa-youtube"></i> Video won&apos;t play? Watch it on YouTube
        </a>
      </>
    );
  }

  return (
    <div className="vp-wrap">
      <div ref={hostRef} className="vp-iframe"></div>
    </div>
  );
};

const VideoPlayer = ({ src, poster, youtubeEmbed }) => {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };
  const skip = (n) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + n), dur || v.duration || 0);
  };
  const seek = (e) => {
    const v = videoRef.current;
    if (!v || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  };
  const fullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };
  const start = () => {
    setStarted(true);
    setTimeout(() => videoRef.current?.play(), 0);
  };
  const close = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    setStarted(false);
  };

  // YouTube — через IFrame API, чтобы поймать запрет встраивания и дать ссылку на YouTube
  if (youtubeEmbed) {
    const vid = extractYtId(youtubeEmbed);
    if (vid) return <YouTubePlayer videoId={vid} embedUrl={youtubeEmbed} />;
    return (
      <div className="vp-wrap">
        <iframe
          className="vp-iframe"
          src={youtubeEmbed}
          title="video"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div className="vp-wrap" ref={wrapRef}>
      <video
        ref={videoRef}
        className="vp-video"
        src={src}
        poster={poster}
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setCur(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDur(videoRef.current?.duration || 0)}
        onClick={togglePlay}
      />

      {!started ? (
        <button className="vp-bigplay" onClick={start} aria-label="Play">
          <i className="fa-solid fa-play"></i>
        </button>
      ) : (
        <>
          <button className="vp-close" onClick={close} aria-label="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="vp-center">
            <button className="vp-ctrl" onClick={() => skip(-10)} aria-label="Back 10s">
              <i className="fa-solid fa-rotate-left"></i>
              <span className="vp-ctrl-num">10</span>
            </button>
            <button className="vp-ctrl vp-play" onClick={togglePlay} aria-label="Play / Pause">
              <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button className="vp-ctrl" onClick={() => skip(10)} aria-label="Forward 10s">
              <i className="fa-solid fa-rotate-right"></i>
              <span className="vp-ctrl-num">10</span>
            </button>
          </div>

          <div className="vp-bottom">
            <button className="vp-fs" onClick={fullscreen} aria-label="Fullscreen">
              <i className="fa-solid fa-expand"></i>
            </button>
            <div className="vp-progress" onClick={seek}>
              <div className="vp-progress-fill" style={{ width: `${dur ? (cur / dur) * 100 : 0}%` }}></div>
            </div>
            <div className="vp-times">
              <span>{fmt(cur)}</span>
              <span>-{fmt(Math.max(0, dur - cur))}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
