'use client';
import { useState, useEffect } from 'react';
import { cachedGet } from '@/lib/apiCache';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import { dropDeadVideos } from '@/lib/deadVideos';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import VideoDetailSkeleton from './VideoDetailSkeleton';
import './SelectedVideoPage.css';

const mediaUrl = (m) => {
  if (!m) return null;
  if (typeof m === 'string') return m.startsWith('http') ? m : `${config.API_URL}${m}`;
  if (m.url) return m.url.startsWith('http') ? m.url : `${config.API_URL}${m.url}`;
  if (m[0]?.url) return m[0].url.startsWith('http') ? m[0].url : `${config.API_URL}${m[0].url}`;
  return null;
};

const ytEmbed = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

// В Strapi у видео стоит заглушка "0:00" (ютуб-ссылки без Data API) — показываем
// бейдж только если есть ненулевое время.
const realDuration = (d) => (/[1-9]/.test(String(d || '')) ? d : null);

const SelectedVideoPage = ({ id }) => {
  const [video, setVideo] = useState(null);
  const [more, setMore] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animDone, setAnimDone] = useState(false); // мишень доиграла
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [oneRes, allRes] = await Promise.all([
          cachedGet(`${config.API_URL}/api/videos/${id}?populate=*`).catch(() => null),
          cachedGet(`${config.API_URL}/api/videos?populate=*&sort=createdAt:desc`),
        ]);
        const one = oneRes?.data?.data || null;
        const all = dropDeadVideos(allRes?.data?.data || []);
        setVideo(one || all.find((v) => String(v.documentId) === String(id)) || null);
        setMore(all);
      } catch (e) {
        console.error('Ошибка загрузки видео:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || !animDone) {
    return <VideoDetailSkeleton onEnded={() => setAnimDone(true)} />;
  }

  if (!video) {
    return (
      <section className="sv-header">
        <div className="sv-breadcrumbs">
          <span className="sv-crumb" onClick={() => router.push('/')}>Home</span>
          <span className="sv-crumb-sep">›</span>
          <span className="sv-crumb" onClick={() => router.push('/media')}>Media</span>
        </div>
        <h1 className="sv-title">Video not found</h1>
      </section>
    );
  }

  const fileSrc = mediaUrl(video.videoFile);
  const embed = !fileSrc ? ytEmbed(video.videoUrl) : null;
  const poster = mediaUrl(video.thumbnail);
  const otherVideos = more.filter((v) => v.documentId !== video.documentId);

  return (
    <>
      <section className="sv-header">
        <div className="sv-breadcrumbs">
          <span className="sv-crumb" onClick={() => router.push('/')}>Home</span>
          <span className="sv-crumb-sep">›</span>
          <span className="sv-crumb" onClick={() => router.push('/media')}>Media</span>
          <span className="sv-crumb-sep">›</span>
          <span className="sv-crumb sv-crumb-active">{video.title}</span>
        </div>
        <h1 className="sv-title">{video.title}</h1>
      </section>

      <section className="sv-content">
        <VideoPlayer src={fileSrc || video.videoUrl} poster={poster} youtubeEmbed={embed} />

        <div className="sv-more-label">MORE VIDEOS</div>
        {otherVideos.length > 0 ? (
          <div className="sv-grid">
            {otherVideos.map((v) => (
              <div
                key={v.id}
                className="sv-card"
                onClick={() => router.push(`/media/video/${v.documentId}`)}
              >
                <div className="sv-card-cover" style={{ backgroundImage: `url(${mediaUrl(v.thumbnail)})` }}>
                  <div className="sv-card-play"><i className="fa-solid fa-play"></i></div>
                  {realDuration(v.duration) && <span className="sv-card-duration">{realDuration(v.duration)}</span>}
                </div>
                <div className="sv-card-panel">
                  <h3 className="sv-card-title">{v.title}</h3>
                  {v.date && <span className="sv-card-date">{formatDate(v.date)}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="sv-more-empty">
            <i className="fa-regular fa-circle-play sv-more-empty-icon"></i>
            <span>No other videos yet — check back soon.</span>
          </div>
        )}
      </section>
    </>
  );
};

export default SelectedVideoPage;
