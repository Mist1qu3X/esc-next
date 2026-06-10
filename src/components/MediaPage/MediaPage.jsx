'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import { useRouter } from 'next/navigation';
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
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const latestNewsRef = useRef(null);
  const spotlightRef = useRef(null);
  const videosRef = useRef(null);

  const filters = ['ALL', 'NEWS', 'FEATURES', 'INTERVIEWS', 'VIDEOS', 'PRESS', 'RELEASES'];

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
        const [newsRes, videosRes, docsRes, streamsRes, spotlightsRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/news-items?populate=*&sort=date:desc&limit=20`),
          axios.get(`${config.API_URL}/api/videos?populate=*&limit=20`),
          axios.get(`${config.API_URL}/api/docs?populate=*&limit=20`),
          axios.get(`${config.API_URL}/api/live-streams?populate=*&limit=10`),
          axios.get(`${config.API_URL}/api/spotlight-items?populate=*&limit=4`),
        ]);
        
        setNews(extractData(newsRes));
        setVideos(extractData(videosRes));
        setDocs(extractData(docsRes));
        setStreams(extractData(streamsRes));
        setSpotlights(extractData(spotlightsRes));
        
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
    if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
    if (img.url) return img.url.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
    if (img[0]?.url) return img[0].url.startsWith('http') ? img[0].url : `${config.API_URL}${img[0].url}`;
    return null;
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    if (activeFilter === 'ALL' || activeFilter === 'PRESS') {
      return docs.filter((d) => d.theme === 'PRESS RELEASES').slice(0, 4);
    }
    if (activeFilter === 'RELEASES') {
      return docs.filter((d) => d.theme === 'RELEASES').slice(0, 4);
    }
    return [];
  };

  const pressReleases = getFilteredPressReleases();

  const mainStream = streams.find((s) => s.isMain === true);
  const sideStreams = streams.filter((s) => !s.isMain).slice(0, 2);

  const platformClass = (p) => {
    if (p === 'youtube') return 'youtube';
    if (p === 'twitch') return 'twitch';
    if (p === 'facebook') return 'facebook';
    return 'youtube';
  };

  // Проверка, нужно ли показывать секции
  const showFeatured = activeFilter === 'ALL' || ['NEWS', 'FEATURES', 'INTERVIEWS'].includes(activeFilter);
  const showLatestNews = activeFilter === 'ALL' || ['NEWS', 'FEATURES', 'INTERVIEWS'].includes(activeFilter);
  const showVideos = activeFilter === 'ALL' || activeFilter === 'VIDEOS';
  const showLiveStreams = activeFilter === 'ALL' || activeFilter === 'VIDEOS';
  const showPressReleases = activeFilter === 'ALL' || activeFilter === 'PRESS' || activeFilter === 'RELEASES';

  if (loading) {
    return (
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
        <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center' }}>Loading media...</p>
      </section>
    );
  }

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
              <button className="mp-all-articles-btn" onClick={() => router.push('/media')}>ALL VIDEOS ›</button>
            </div>
            <div className="mp-videos-grid">
              {filteredVideos.length > 0 ? (
                filteredVideos.slice(0, 4).map((v) => (
                  <div key={v.id} className="mp-video-card" onClick={() => v.videoUrl && window.open(v.videoUrl, '_blank')} style={{ cursor: 'pointer' }}>
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
            <div className="mp-live-header">
              <span className="mp-live-dot"></span>
              <span className="mp-live-text">LIVE NOW</span>
              <span className="mp-live-streams">{streams.filter(s => s.streamStatus === 'live').length} streams</span>
            </div>
            <div className="mp-live-grid">
              {mainStream && (
                <div className="mp-live-card-main" style={{ backgroundImage: `url(${getImageUrl(mainStream.thumbnail)})` }}>
                  <div className="mp-live-card-top">
                    <div className={`mp-platform-badge ${platformClass(mainStream.platform)}`}>
                      <i className={`fa-brands fa-${mainStream.platform}`}></i>
                      <span>{mainStream.platform}</span>
                    </div>
                    <div className="mp-live-pill">
                      <div className="mp-live-pill-status">
                        <span className="mp-live-pill-dot"></span>
                        <span className="mp-live-pill-text">{mainStream.streamStatus?.toUpperCase()}</span>
                      </div>
                      <div className="mp-live-pill-stats">
                        <i className="fa-regular fa-eye"></i>
                        <span className="mp-views-count">{mainStream.views}</span>
                        <span className="mp-stat-separator">·</span>
                        <span className="mp-duration">{mainStream.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mp-live-play-btn" onClick={() => window.open(mainStream.url, '_blank')}>
                    <i className="fa-solid fa-play"></i>
                  </div>
                  <div className="mp-live-card-bottom">
                    <span className="mp-live-event">{mainStream.eventName}</span>
                    <h3 className="mp-live-title">{mainStream.title}</h3>
                    <button className={`mp-watch-btn ${platformClass(mainStream.platform)}-btn`} onClick={() => window.open(mainStream.url, '_blank')}>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      WATCH ON {mainStream.platform?.toUpperCase()}
                    </button>
                  </div>
                </div>
              )}
              <div className="mp-live-right-column">
                {sideStreams.map((s) => (
                  <div key={s.id} className="mp-live-card-small" style={{ backgroundImage: `url(${getImageUrl(s.thumbnail)})` }}>
                    <div className="mp-live-card-top">
                      <div className={`mp-platform-badge ${platformClass(s.platform)}`}>
                        <i className={`fa-brands fa-${s.platform}`}></i>
                        <span>{s.platform}</span>
                      </div>
                      <div className="mp-live-pill mp-live-pill-small">
                        <div className="mp-live-pill-status mp-live-pill-status-small">
                          <span className="mp-live-pill-dot"></span>
                          <span className="mp-live-pill-text">{s.streamStatus?.toUpperCase()}</span>
                        </div>
                        <div className="mp-live-pill-stats mp-live-pill-stats-small">
                          <i className="fa-regular fa-eye"></i>
                          <span className="mp-views-count">{s.views}</span>
                          <span className="mp-stat-separator">·</span>
                          <span className="mp-duration">{s.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mp-live-play-btn-small" onClick={() => window.open(s.url, '_blank')}>
                      <i className="fa-solid fa-play"></i>
                    </div>
                    <div className="mp-live-card-small-content">
                      <span className="mp-live-event-small">{s.eventName}</span>
                      <h4 className="mp-live-title-small">{s.title}</h4>
                      <button className={`mp-watch-btn mp-watch-btn-small ${platformClass(s.platform)}-btn`} onClick={() => window.open(s.url, '_blank')}>
                        <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        WATCH ON {s.platform?.toUpperCase()}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRESS RELEASES */}
        {showPressReleases && (
          <div>
            <div className="mp-section-header">
              <div className="mp-section-label">
                <span className="mp-section-line mp-grey"></span>
                <span className="mp-section-text mp-grey-text">
                  {activeFilter === 'PRESS' ? 'PRESS RELEASES' : activeFilter === 'RELEASES' ? 'RELEASES' : 'PRESS RELEASES'}
                </span>
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
    </>
  );
};

export default MediaPage;