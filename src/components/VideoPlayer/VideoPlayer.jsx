'use client';
import { useState, useRef } from 'react';
import './VideoPlayer.css';

const fmt = (s) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
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

  // YouTube — обычный iframe
  if (youtubeEmbed) {
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
