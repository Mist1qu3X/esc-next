'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import PageLoader from '@/components/LoadingResults/PageLoader';
import './PhotoAlbumPage.css';

const getImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
  if (img.url) return img.url.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
  if (img[0]?.url) return img[0].url.startsWith('http') ? img[0].url : `${config.API_URL}${img[0].url}`;
  return null;
};

const PhotoAlbumPage = ({ slug }) => {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoDone, setVideoDone] = useState(false);
  const [selected, setSelected] = useState(0);
  const trackRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await axios.get(
          `${config.API_URL}/api/photos?filters[slug][$eq]=${slug}&populate=*`
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

  // Список фотографий: альбом (images) либо одиночная обложка
  const photos =
    album && Array.isArray(album.images) && album.images.length > 0
      ? album.images
      : album?.image
      ? [album.image]
      : [];

  const total = photos.length;

  // Императивная прокрутка ленты к индексу (без завязки на state, чтобы не было петли)
  const scrollToIndex = (i) => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  const goPrev = () => total && scrollToIndex((selected - 1 + total) % total);
  const goNext = () => total && scrollToIndex((selected + 1) % total);

  // Прокрутка/свайп только обновляет активную миниатюру (никакого встречного скролла)
  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    setSelected((prev) => (prev !== idx ? idx : prev));
  };

  if (loading || !videoDone) {
    return <PageLoader variant="detail" dataReady={!loading} onDone={() => setVideoDone(true)} />;
  }

  if (!album) {
    return (
      <section className="pa-header">
        <div className="pa-breadcrumbs">
          <span className="pa-crumb" onClick={() => router.push('/')}>Home</span>
          <span className="pa-crumb-sep">›</span>
          <span className="pa-crumb" onClick={() => router.push('/media')}>Media</span>
        </div>
        <h1 className="pa-title">Album not found</h1>
      </section>
    );
  }

  return (
    <>
      <section className="pa-header">
        <div className="pa-breadcrumbs">
          <span className="pa-crumb" onClick={() => router.push('/')}>Home</span>
          <span className="pa-crumb-sep">›</span>
          <span className="pa-crumb" onClick={() => router.push('/media')}>Media</span>
          <span className="pa-crumb-sep">›</span>
          <span className="pa-crumb pa-crumb-active">{album.title}</span>
        </div>
        <h1 className="pa-title">{album.title}</h1>
      </section>

      <section className="pa-content">
        {/* Большое фото: стрелки на десктопе, свайп/прокрутка на ≤960 */}
        <div className="pa-viewer">
          <div className="pa-track" ref={trackRef} onScroll={onTrackScroll}>
            {photos.map((ph, i) => (
              <div className="pa-slide" key={ph.id || i}>
                <div className="pa-slide-bg" style={{ backgroundImage: `url(${getImageUrl(ph)})` }}></div>
                <img className="pa-slide-img" src={getImageUrl(ph)} alt={album.title} draggable={false} />
              </div>
            ))}
          </div>
          {total > 1 && (
            <>
              <button className="pa-arrow pa-arrow-prev" onClick={goPrev} aria-label="Previous">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button className="pa-arrow pa-arrow-next" onClick={goNext} aria-label="Next">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </>
          )}
        </div>

        {/* Все фото альбома */}
        <div className="pa-all-label">ALL PHOTO</div>
        <div className="pa-grid">
          {photos.map((ph, i) => (
            <div
              key={ph.id || i}
              className={`pa-thumb ${i === selected ? 'pa-active' : ''}`}
              style={{ backgroundImage: `url(${getImageUrl(ph)})` }}
              onClick={() => scrollToIndex(i)}
            ></div>
          ))}
        </div>
      </section>
    </>
  );
};

export default PhotoAlbumPage;
