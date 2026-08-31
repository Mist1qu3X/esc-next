'use client';
import { useState, useEffect, useRef } from 'react';
import { cachedGet } from '@/lib/apiCache';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import { imageUrl } from '@/lib/media';
import LazyBg from '@/components/LazyBg/LazyBg';
import PhotoAlbumSkeleton from './PhotoAlbumSkeleton';
import ErrorPage from '@/components/ErrorPage/ErrorPage';
import './PhotoAlbumPage.css';

const getImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
  if (img.url) return img.url.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
  if (img[0]?.url) return img[0].url.startsWith('http') ? img[0].url : `${config.API_URL}${img[0].url}`;
  return null;
};

// Скачивание изображения через серверный прокси /api/download-image.
// Прямой fetch().blob() к S3 падает на CORS (Selectel непоследовательно отдаёт
// ACAO на размерных превью), поэтому качаем через свой same-origin роут,
// который проставляет Content-Disposition: attachment.
const downloadImage = (url, filename) => {
  if (!url) return;
  const name = filename || 'image.jpg';
  const href = `/api/download-image?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const PhotoAlbumPage = ({ slug }) => {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animDone, setAnimDone] = useState(false);
  const [selected, setSelected] = useState(0);
  const trackRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await cachedGet(
          `${config.API_URL}/api/photos?filters[slug][$eq]=${slug}&populate[image]=true&populate[images]=true`
        );
        const data = res.data?.data || [];
        setAlbum(data[0] || null);
      } catch (e) {
        console.error('Ошибка загрузки альбома:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [slug]);

  const realCount =
    album && Array.isArray(album.images) && album.images.length > 0
      ? album.images.length
      : (album?.photoCount || 0);

  const photos =
    album && Array.isArray(album.images) && album.images.length > 0
      ? album.images
      : realCount > 0 && album?.image
      ? [album.image]
      : [];

  const total = photos.length;

  const scrollToIndex = (i) => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  const goPrev = () => { if (selected > 0) scrollToIndex(selected - 1); };
  const goNext = () => { if (selected < total - 1) scrollToIndex(selected + 1); };

  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    setSelected((prev) => (prev !== idx ? idx : prev));
  };

  // Обработчик скачивания текущего изображения
  const handleDownload = () => {
    if (total === 0 || !photos[selected]) return;
    const imgUrl = imageUrl(photos[selected], 'large') || getImageUrl(photos[selected]);
    if (imgUrl) {
      const filename = `${album?.title || 'photo'}-${selected + 1}.jpg`;
      downloadImage(imgUrl, filename);
    }
  };

  if (loading || !animDone) {
    return <PhotoAlbumSkeleton onEnded={() => setAnimDone(true)} />;
  }

  if (!album) {
    return <ErrorPage />;
  }

  return (
    <>
      <section className="pa-header">
        <div className="pa-breadcrumbs">
          <span className="pa-crumb" onClick={() => router.push('/')}>Home</span>
          <span className="pa-crumb-sep">›</span>
          <span className="pa-crumb" onClick={() => router.push('/media?filter=PHOTO')}>Media</span>
          <span className="pa-crumb-sep">›</span>
          <span className="pa-crumb pa-crumb-active">{album.title}</span>
        </div>
        <h1 className="pa-title">{album.title}</h1>
      </section>

      <section className="pa-content">
        {total === 0 ? (
          <div className="pa-empty">
            <i className="fa-regular fa-images pa-empty-icon"></i>
            <p className="pa-empty-title">No photos in this album yet</p>
            <p className="pa-empty-text">Images will appear here once they&apos;re uploaded.</p>
          </div>
        ) : (
          <>
            <div className="pa-viewer">
              <div className="pa-track" ref={trackRef} onScroll={onTrackScroll}>
                {photos.map((ph, i) => (
                  <div className="pa-slide" key={ph.id || i}>
                    <LazyBg className="pa-slide-bg" src={imageUrl(ph, 'large') || getImageUrl(ph)} eager={i === 0}></LazyBg>
                    <img className="pa-slide-img" src={imageUrl(ph, 'large') || getImageUrl(ph)} alt={album.title}
                         draggable={false} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
                  </div>
                ))}
              </div>
              {total > 1 && (
                <>
                  <button className="pa-arrow pa-arrow-prev" onClick={goPrev} disabled={selected === 0} aria-label="Previous">
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button className="pa-arrow pa-arrow-next" onClick={goNext} disabled={selected >= total - 1} aria-label="Next">
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                  {/* Кнопка скачивания слева от счётчика */}
                  <button className="pa-download-btn" onClick={handleDownload} aria-label="Download image">
                    <i className="fa-solid fa-download"></i>
                  </button>
                  <span className="pa-counter">{selected + 1} / {total}</span>
                </>
              )}
            </div>

            {total > 1 && (
              <>
                <div className="pa-all-label">ALL PHOTO · {total} PHOTOS</div>
                <div className="pa-grid">
                  {photos.map((ph, i) => (
                    <LazyBg
                      key={ph.id || i}
                      className={`pa-thumb ${i === selected ? 'pa-active' : ''}`}
                      src={imageUrl(ph, 'small') || getImageUrl(ph)}
                      onClick={() => scrollToIndex(i)}
                    ></LazyBg>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
};

export default PhotoAlbumPage;