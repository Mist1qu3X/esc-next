'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import { useRouter } from 'next/navigation';
import StreamPlayer, { canEmbed } from '@/components/StreamPlayer/StreamPlayer';
import './MediaPage.css';

// Универсальная функция для извлечения данных из любого ответа Strapi
const extractData = (response) => {
  if (!response || !response.data) return [];
  if (response.data.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

const MediaPage = () => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [docs, setDocs] = useState([]);
  const [streams, setStreams] = useState([]);
  const [spotlights, setSpotlights] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null); // стрим, открытый во встроенном плеере
  
  const router = useRouter();
  const latestNewsRef = useRef(null);
  const spotlightRef = useRef(null);
  const videosRef = useRef(null);

  const filters = ['ALL', 'NEWS', 'FEATURES', 'INTERVIEWS', 'PHOTO', 'VIDEOS', 'PRESS RELEASES'];

  // Предвыбор вкладки из ?filter= (ссылки из хедера/футера)
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('filter');
    if (f && filters.includes(f)) setActiveFilter(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToElement = (element) => {
    if (!element) return;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - 100;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
  };

  useEffect(() => {
    const checkHashAndScroll = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash === '#latest-news' && latestNewsRef.current) {
          setTimeout(() => scrollToElement(latestNewsRef.current), 300);
        } else if (hash === '#spotlight' && spotlightRef.current) {
          setTimeout(() => scrollToElement(spotlightRef.current), 300);
        } else if (hash === '#videos' && videosRef.current) {
          setTimeout(() => scrollToElement(videosRef.current), 300);
        }
      }
    };
    checkHashAndScroll();
    window.addEventListener('hashchange', checkHashAndScroll);
    return () => window.removeEventListener('hashchange', checkHashAndScroll);
  }, [news, spotlights, videos]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, videosRes, docsRes, streamsRes, spotlightsRes, photosRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/news-items?populate=*&sort=date:desc&pagination[pageSize]=100`),
          axios.get(`${config.API_URL}/api/videos?populate[thumbnail]=true&populate[videoFile]=true&sort=order:asc&pagination[pageSize]=100`),
          // docs/streams/photos: только общие (без привязки к событию) — событийные живут на странице события
          axios.get(`${config.API_URL}/api/docs?populate=*&sort=date:desc&pagination[pageSize]=100&filters[eventSlug][$null]=true`),
          axios.get(`${config.API_URL}/api/live-streams?populate[thumbnail]=true&pagination[pageSize]=10&filters[eventSlug][$null]=true`),
          axios.get(`${config.API_URL}/api/spotlight-items?populate=*&pagination[pageSize]=4`),
          axios.get(`${config.API_URL}/api/photos?populate=*&sort=date:desc&pagination[pageSize]=100&filters[eventSlug][$null]=true`).catch(() => ({ data: { data: [] } })),
        ]);

        setNews(extractData(newsRes));
        setVideos(extractData(videosRes));
        setDocs(extractData(docsRes));
        setStreams(extractData(streamsRes));
        setSpotlights(extractData(spotlightsRes));
        setPhotos(extractData(photosRes));
        
        setLoading(false);
      } catch (e) { 
        console.error('Ошибка загрузки Media:', e);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getImageUrl = (img) => {
    if (!img) return null;
    const abs = (u) => (u && (u.startsWith('http') ? u : `${config.API_URL}${u}`));
    if (typeof img === 'string') return abs(img);
    if (img.url) return abs(img.url);
    if (img.data?.attributes?.url) return abs(img.data.attributes.url); // Strapi v4 single
    if (Array.isArray(img.data) && img.data[0]?.attributes?.url) return abs(img.data[0].attributes.url); // v4 multiple
    if (img[0]?.url) return abs(img[0].url);
    return null;
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Формат для фото-карточек: "05 June 2026"
  const formatDatePhoto = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const goToNews = (slug) => {
    if (slug) router.push(`/media/${slug}`);
  };

  // ФИЛЬТРАЦИЯ НОВОСТЕЙ по выбранной категории
  const getFilteredNews = () => {
    if (activeFilter === 'ALL') {
      return news;
    }
    if (activeFilter === 'VIDEOS') {
      // Для VIDEOS показываем секцию видео отдельно, здесь возвращаем пустой массив
      return [];
    }
    return news.filter(item => item.theme?.toUpperCase() === activeFilter);
  };

  const filteredNews = getFilteredNews();
  const featuredNews = filteredNews.slice(0, 2);
  const latestNews = filteredNews.slice(2, 6);
  
  // Фильтр для VIDEOS
  const getFilteredVideos = () => {
    if (activeFilter === 'ALL' || activeFilter === 'VIDEOS') {
      return videos;
    }
    return [];
  };

  const filteredVideos = getFilteredVideos();

  // Фильтр для PRESS RELEASES
  const getFilteredPressReleases = () => {
    if (activeFilter === 'ALL' || activeFilter === 'PRESS RELEASES') {
      return docs
        .filter((d) => d.theme === 'PRESS RELEASES' || d.theme === 'RELEASES')
        .slice(0, 4);
    }
    return [];
  };

  const pressReleases = getFilteredPressReleases();

  const normPlatform = (p) => (p || '').toString().trim().toLowerCase();

  const platformClass = (p) => {
    if (normPlatform(p) === 'facebook') return 'facebook';
    return 'youtube';
  };

  // Показываем стримы (live + upcoming). Метрики (зрители/хронометраж) — только у реального эфира.
  const liveCount = streams.filter((s) => (s.streamStatus || '').toLowerCase() === 'live').length;
  const youtubeStream = streams.find((s) => normPlatform(s.platform) === 'youtube');
  const facebookStream = streams.find((s) => normPlatform(s.platform) === 'facebook');
  let liveStreams = [youtubeStream, facebookStream].filter(Boolean);
  if (liveStreams.length < 2) {
    const rest = streams.filter((s) => !liveStreams.includes(s));
    liveStreams = [...liveStreams, ...rest].slice(0, 2);
  }

  // Проверка, нужно ли показывать секции
  const showFeatured = activeFilter === 'ALL' || ['NEWS', 'FEATURES', 'INTERVIEWS'].includes(activeFilter);
  const showLatestNews = activeFilter === 'ALL' || ['NEWS', 'FEATURES', 'INTERVIEWS'].includes(activeFilter);
  const showVideos = activeFilter === 'ALL';          // превью-ряд видео на ALL
  const showVideoGallery = activeFilter === 'VIDEOS'; // отдельная галерея видео (как PHOTO)
  const showLiveStreams = activeFilter === 'ALL' && liveStreams.length > 0; // только если реально идёт эфир
  const showPressReleases = activeFilter === 'ALL' || activeFilter === 'PRESS RELEASES';
  const showPhotos = activeFilter === 'PHOTO';

  return (
    <>
      <section className="mp-media-header">
        <div className="mp-breadcrumbs-row">
          <span className="mp-breadcrumb-home">Home</span>
          <span className="mp-breadcrumb-separator">›</span>
          <span className="mp-breadcrumb-active">Media</span>
        </div>
        <div className="mp-next-layer">
          <span className="mp-breadcrumb-line"></span>
          <span className="mp-breadcrumb-subtitle">ESC NEWSROOM</span>
        </div>
        <h1 className="mp-media-title">MEDIA & NEWS</h1>
        <div className="mp-media-divider"></div>
        <div className="mp-media-filters">
          {filters.map((f) => (
            <button 
              key={f} 
              className={`mp-filter-btn ${activeFilter === f ? 'active' : ''}`} 
              onClick={() => setActiveFilter(f)}
            >
              {f}<span className="mp-filter-line"></span>
            </button>
          ))}
        </div>
      </section>

      {loading ? (
      <section className="mp-news-content">
        <div className="mp-featured-container">
          {Array.from({ length: 3 }).map((_, i) => <div className="mp-featured-card skeleton" key={i} style={{ minHeight: 260 }}></div>)}
        </div>
        <div className="mp-latest-news-grid" style={{ marginTop: 40 }}>
          {Array.from({ length: 6 }).map((_, i) => <div className="mp-news-card skeleton" key={i} style={{ minHeight: 300 }}></div>)}
        </div>
      </section>
      ) : (
      <section className="mp-news-content">
        {/* FEATURED */}
        {showFeatured && (
          <>
            <div className="mp-section-label">
              <span className="mp-section-line mp-blue"></span>
              <span className="mp-section-text">FEATURED</span>
            </div>
            <div className="mp-featured-container">
              {featuredNews.length > 0 ? (
                featuredNews.map((item) => (
                  <div key={item.id} className="mp-featured-card" 
                    style={{ backgroundImage: `url(${getImageUrl(item.image)})`, cursor: 'pointer' }}
                    onClick={() => goToNews(item.slug)}>
                    <div className="mp-featured-overlay">
                      <span className="mp-news-type">{item.theme || 'CHAMPIONSHIP'}</span>
                      <h2 className="mp-featured-title">{item.title}</h2>
                      <div className="mp-featured-footer">
                        <span className="mp-news-date">{formatDate(item.date)}</span>
                        <span className="mp-read-more-btn">READ MORE ›</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center', width: '100%' }}>
                  No featured {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} news available
                </p>
              )}
            </div>
          </>
        )}

        {/* PHOTO GALLERY */}
        {showPhotos && (
          <div>
            <h2 className="mp-photo-heading">PHOTO</h2>
            <div className="mp-photo-grid">
              {photos.length > 0 ? (
                photos.map((p) => {
                  const cover = getImageUrl(p.image) || getImageUrl(p.images);
                  const count = Array.isArray(p.images) && p.images.length > 0 ? p.images.length : (p.photoCount || 0);
                  return (
                    <div
                      key={p.id}
                      className="mp-photo-card"
                      onClick={() => p.slug && router.push(`/media/photo/${p.slug}`)}
                      style={{ cursor: p.slug ? 'pointer' : 'default' }}
                    >
                      <div className="mp-photo-cover" style={{ backgroundImage: `url(${cover})` }}></div>
                      <div className="mp-photo-panel">
                        <h3 className="mp-photo-title">{p.title}</h3>
                        <div className="mp-photo-footer">
                          <span className="mp-photo-date">{formatDatePhoto(p.date)}</span>
                          <span className="mp-photo-count">
                            <i className="fa-regular fa-images"></i>{count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center', width: '100%' }}>
                  No photos available
                </p>
              )}
            </div>
          </div>
        )}

        {/* VIDEO GALLERY (вкладка VIDEOS — чистое видео, как PHOTO) */}
        {showVideoGallery && (
          <div>
            <h2 className="mp-photo-heading">VIDEOS</h2>
            <div className="mp-photo-grid">
              {videos.length > 0 ? (
                videos.map((v) => (
                  <div
                    key={v.id}
                    className="mp-photo-card"
                    onClick={() => router.push(`/media/video/${v.documentId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mp-vgal-cover" style={{ backgroundImage: `url(${getImageUrl(v.thumbnail)})` }}>
                      <div className="mp-vgal-play"><i className="fa-solid fa-play"></i></div>
                      {v.duration && <span className="mp-vgal-duration">{v.duration}</span>}
                    </div>
                    <div className="mp-photo-panel">
                      <h3 className="mp-photo-title">{v.title}</h3>
                      <div className="mp-photo-footer">
                        <span className="mp-photo-date">{formatDatePhoto(v.date)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center', width: '100%' }}>
                  No videos available
                </p>
              )}
            </div>
          </div>
        )}

        {/* LATEST NEWS */}
        {showLatestNews && (
          <div ref={latestNewsRef}>
            <div className="mp-section-header" id="latest-news">
              <div className="mp-section-label">
                <span className="mp-section-line mp-grey"></span>
                <span className="mp-section-text mp-grey-text">LATEST NEWS</span>
              </div>
              <button className="mp-all-articles-btn" onClick={() => router.push('/media')}>ALL ARTICLES ›</button>
            </div>
            <div className="mp-latest-news-grid">
              {latestNews.length > 0 ? (
                latestNews.map((item) => (
                  <div key={item.id} className="mp-news-card" onClick={() => goToNews(item.slug)} style={{ cursor: 'pointer' }}>
                    <div className="mp-news-card-image" style={{ backgroundImage: `url(${getImageUrl(item.image)})` }}></div>
                    <div className="mp-news-card-content">
                      <span className={`mp-news-type mp-type-${item.theme?.toLowerCase() || 'education'}`}>{item.theme || 'NEWS'}</span>
                      <h3 className="mp-news-card-title">{item.title}</h3>
                      <p className="mp-news-card-desc">{item.description}</p>
                      <span className="mp-news-card-date">{formatDate(item.date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center', width: '100%' }}>
                  No latest {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} news available
                </p>
              )}
            </div>
          </div>
        )}

        {/* VIDEOS */}
        {showVideos && (
          <div ref={videosRef}>
            <div className="mp-section-header" id="videos">
              <div className="mp-section-label">
                <span className="mp-section-line mp-blue"></span>
                <span className="mp-section-text">VIDEOS</span>
              </div>
              <button className="mp-all-articles-btn" onClick={() => setActiveFilter('VIDEOS')}>ALL VIDEOS ›</button>
            </div>
            <div className="mp-videos-grid">
              {filteredVideos.length > 0 ? (
                filteredVideos.slice(0, 4).map((v) => (
                  <div key={v.id} className="mp-video-card" onClick={() => router.push(`/media/video/${v.documentId}`)} style={{ cursor: 'pointer' }}>
                    <div className="mp-video-thumbnail" style={{ backgroundImage: `url(${getImageUrl(v.thumbnail)})` }}>
                      <div className="mp-video-play-btn"><i className="fa-solid fa-play"></i></div>
                      <span className="mp-video-duration">{v.duration || '4:38'}</span>
                    </div>
                    <div className="mp-video-info">
                      <span className="mp-video-label">VIDEO</span>
                      <h3 className="mp-video-title">{v.title}</h3>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center', width: '100%' }}>
                  No videos available
                </p>
              )}
            </div>
          </div>
        )}

        {/* LIVE STREAMS */}
        {showLiveStreams && streams.length > 0 && (
          <div className="mp-live-block">
            <div className={`mp-live-header ${liveCount > 0 ? '' : 'is-idle'}`}>
              <span className="mp-live-dot"></span>
              <span className="mp-live-text">{liveCount > 0 ? 'LIVE NOW' : 'STREAMS'}</span>
              <span className="mp-live-streams">
                {liveCount > 0 ? `${liveCount} live` : `${liveStreams.length} upcoming`}
              </span>
            </div>
            <div className="mp-live-grid">
              {liveStreams.map((s) => {
                const isLive = (s.streamStatus || '').toLowerCase() === 'live';
                const open = () => (canEmbed(s) ? setPlaying(s) : s.url && window.open(s.url, '_blank'));
                return (
                <div key={s.id} className={`mp-live-card-main ${platformClass(s.platform)}`} style={{ backgroundImage: `url(${getImageUrl(s.thumbnail)})` }}>
                  <div className="mp-live-card-top">
                    <div className={`mp-platform-badge ${platformClass(s.platform)}`}>
                      <i className={`fa-brands fa-${platformClass(s.platform)}`}></i>
                      <span>{platformClass(s.platform)}</span>
                    </div>
                    <div className={`mp-live-pill ${isLive ? 'is-live' : 'is-upcoming'}`}>
                      <div className="mp-live-pill-status">
                        <span className="mp-live-pill-dot"></span>
                        <span className="mp-live-pill-text">{isLive ? 'LIVE' : 'UPCOMING'}</span>
                      </div>
                      {/* Зрители/хронометраж — только у реального эфира (для upcoming это нелогично) */}
                      {isLive && (s.views || s.duration) && (
                        <div className="mp-live-pill-stats">
                          {s.views && (<><i className="fa-regular fa-eye"></i><span className="mp-views-count">{s.views}</span></>)}
                          {s.views && s.duration && <span className="mp-stat-separator">·</span>}
                          {s.duration && <span className="mp-duration">{s.duration}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mp-live-play-btn" onClick={open}>
                    <i className="fa-solid fa-play"></i>
                  </div>
                  <div className="mp-live-card-bottom">
                    <span className="mp-live-event">{s.eventName}</span>
                    <h3 className="mp-live-title">{s.title}</h3>
                    <button className={`mp-watch-btn ${platformClass(s.platform)}-btn`} onClick={open}>
                      <i className="fa-solid fa-play"></i>
                      {isLive ? 'WATCH LIVE' : 'WATCH'}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRESS RELEASES */}
        {showPressReleases && (
          <div>
            <div className="mp-section-header">
              <div className="mp-section-label">
                <span className="mp-section-line mp-grey"></span>
                <span className="mp-section-text mp-grey-text">PRESS RELEASES</span>
              </div>
            </div>
            <div className="mp-press-divider"></div>
            <div className="mp-press-list">
              {pressReleases.length > 0 ? pressReleases.map((doc) => (
                <div key={doc.id} className="mp-press-item">
                  <div className="mp-press-info">
                    <h4 className="mp-press-title">{doc.title}</h4>
                    <span className="mp-press-meta">{formatDate(doc.date)} · PDF {doc.fileSize || '0.3 MB'}</span>
                  </div>
                  <button className="mp-download-btn-press" onClick={() => {
                    const url = doc.file?.url;
                    if (url) window.open(url.startsWith('http') ? url : `${config.API_URL}${url}`, '_blank');
                  }}>
                    <i className="fa-solid fa-download"></i>DOWNLOAD
                  </button>
                </div>
              )) : (
                <p style={{ color: 'rgba(255,255,255,0.4)', padding: '20px 0' }}>No {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} documents available</p>
              )}
            </div>
          </div>
        )}
      </section>
      )}

      <StreamPlayer stream={playing} onClose={() => setPlaying(null)} />
    </>
  );
};

export default MediaPage;