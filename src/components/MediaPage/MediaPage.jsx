'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import { useRouter } from 'next/navigation';
import './MediaPage.css';

const MediaPage = () => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [docs, setDocs] = useState([]);
  const [streams, setStreams] = useState([]);
  const [spotlights, setSpotlights] = useState([]);
  
  const router = useRouter();
  const latestNewsRef = useRef(null);
  const spotlightRef = useRef(null);
  const videosRef = useRef(null);

  const filters = ['ALL', 'NEWS', 'FEATURES', 'INTERVIEWS', 'VIDEOS', 'PRESS', 'RELEASES'];

  // Функция прокрутки с учетом offset
  const scrollToElement = (element) => {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - 100;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  };

  // Прокрутка к секциям при наличии hash
  useEffect(() => {
    const checkHashAndScroll = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        
        if (hash === '#latest-news' && latestNewsRef.current) {
          setTimeout(() => {
            scrollToElement(latestNewsRef.current);
          }, 300);
        } else if (hash === '#spotlight' && spotlightRef.current) {
          setTimeout(() => {
            scrollToElement(spotlightRef.current);
          }, 300);
        } else if (hash === '#videos' && videosRef.current) {
          setTimeout(() => {
            scrollToElement(videosRef.current);
          }, 300);
        }
      }
    };

    checkHashAndScroll();
    window.addEventListener('hashchange', checkHashAndScroll);
    
    return () => {
      window.removeEventListener('hashchange', checkHashAndScroll);
    };
  }, [news, spotlights, videos]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, videosRes, docsRes, streamsRes, spotlightsRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/news-items?populate=*&sort=date:desc&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/videos?populate=*&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/docs?populate=*&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/live-streams?populate=*&pagination[limit]=10`),
          axios.get(`${config.API_URL}/api/spotlights?populate=*&pagination[limit]=4`),
        ]);
        if (newsRes.data?.data) setNews(newsRes.data.data);
        if (videosRes.data?.data) setVideos(videosRes.data.data);
        if (docsRes.data?.data) setDocs(docsRes.data.data);
        if (streamsRes.data?.data) setStreams(streamsRes.data.data);
        if (spotlightsRes.data?.data) setSpotlights(spotlightsRes.data.data);
      } catch (e) { console.error('Ошибка загрузки Media:', e); }
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
    if (slug) {
      router.push(`/media/${slug}`);
    }
  };

  const featuredNews = news.slice(0, 2);
  const latestNews = news.slice(2, 6);
  const pressReleases = docs.filter((d) => d.theme === 'PRESS RELEASES').slice(0, 4);
  const mainStream = streams.find((s) => s.isMain);
  const sideStreams = streams.filter((s) => !s.isMain).slice(0, 2);

  const platformClass = (p) => {
    if (p === 'youtube') return 'youtube';
    if (p === 'twitch') return 'twitch';
    if (p === 'facebook') return 'facebook';
    return 'youtube';
  };

  return (
    <>
      {/* ========== HERO ========== */}
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
            <button key={f} className={`mp-filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f}<span className="mp-filter-line"></span>
            </button>
          ))}
        </div>
      </section>

      <section className="mp-news-content">
        {/* FEATURED */}
        <div className="mp-section-label">
          <span className="mp-section-line mp-blue"></span>
          <span className="mp-section-text">FEATURED</span>
        </div>
        <div className="mp-featured-container">
          {featuredNews.map((item) => (
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
          ))}
        </div>

        {/* SPOTLIGHT */}
        <div ref={spotlightRef}>
          <div className="mp-section-header" id="spotlight">
            <div className="mp-section-label">
              <span className="mp-section-line mp-blue"></span>
              <span className="mp-section-text">ESC SPOTLIGHT</span>
            </div>
            <button className="mp-all-articles-btn" onClick={() => router.push('/media')}>ALL ARTICLES ›</button>
          </div>
          <div className="mp-spotlight-grid">
            {spotlights.slice(0, 4).map((item) => (
              <div 
                key={item.id} 
                className="mp-spotlight-card" 
                onClick={() => goToNews(item.slug)} 
                style={{ cursor: 'pointer' }}
              >
                <div className="mp-spotlight-image-wrapper">
                  <img src={getImageUrl(item.image)} alt={item.title} className="mp-spotlight-image" />
                </div>
                <div className="mp-spotlight-content">
                  <span className="mp-spotlight-theme">{item.theme}</span>
                  <h3 className="mp-spotlight-title">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LATEST NEWS */}
        <div ref={latestNewsRef}>
          <div className="mp-section-header" id="latest-news">
            <div className="mp-section-label">
              <span className="mp-section-line mp-grey"></span>
              <span className="mp-section-text mp-grey-text">LATEST NEWS</span>
            </div>
            <button className="mp-all-articles-btn" onClick={() => router.push('/media')}>ALL ARTICLES ›</button>
          </div>
          <div className="mp-latest-news-grid">
            {latestNews.map((item) => (
              <div key={item.id} className="mp-news-card" onClick={() => goToNews(item.slug)} style={{ cursor: 'pointer' }}>
                <div className="mp-news-card-image" style={{ backgroundImage: `url(${getImageUrl(item.image)})` }}></div>
                <div className="mp-news-card-content">
                  <span className={`mp-news-type mp-type-${item.theme?.toLowerCase() || 'education'}`}>{item.theme}</span>
                  <h3 className="mp-news-card-title">{item.title}</h3>
                  <p className="mp-news-card-desc">{item.description}</p>
                  <span className="mp-news-card-date">{formatDate(item.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIDEOS */}
        <div ref={videosRef}>
          <div className="mp-section-header" id="videos">
            <div className="mp-section-label">
              <span className="mp-section-line mp-blue"></span>
              <span className="mp-section-text">VIDEOS</span>
            </div>
            <button className="mp-all-articles-btn" onClick={() => router.push('/media')}>ALL VIDEOS ›</button>
          </div>
          <div className="mp-videos-grid">
            {videos.slice(0, 4).map((v) => (
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
            ))}
          </div>
        </div>

        {/* LIVE STREAMS */}
        {streams.length > 0 && (
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
              <p style={{ color: 'rgba(255,255,255,0.4)', padding: '20px 0' }}>No press releases available</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default MediaPage;