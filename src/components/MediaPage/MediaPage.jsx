'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './MediaPage.css';

const MediaPage = () => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [docs, setDocs] = useState([]);
  const [streams, setStreams] = useState([]);

  const filters = ['ALL', 'NEWS', 'FEATURES', 'INTERVIEWS', 'VIDEOS', 'PRESS', 'RELEASES'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, videosRes, docsRes, streamsRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/news-items?populate=*&sort=date:desc&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/videos?populate=*&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/docs?populate=*&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/live-streams?populate=*&pagination[limit]=10`),
        ]);
        if (newsRes.data?.data) setNews(newsRes.data.data);
        if (videosRes.data?.data) setVideos(videosRes.data.data);
        if (docsRes.data?.data) setDocs(docsRes.data.data);
        if (streamsRes.data?.data) setStreams(streamsRes.data.data);
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
    if (slug) window.location.href = `/media/${slug}`;
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
      <section className="media-header">
        <div className="breadcrumbs-row">
          <span className="breadcrumb-home">Home</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">Media</span>
        </div>
        <div className="next-layer">
          <span className="breadcrumb-line"></span>
          <span className="breadcrumb-subtitle">ESC NEWSROOM</span>
        </div>
        <h1 className="media-title">MEDIA & NEWS</h1>
        <div className="media-divider"></div>
        <div className="media-filters">
          {filters.map((f) => (
            <button key={f} className={`filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f}<span className="filter-line"></span>
            </button>
          ))}
        </div>
      </section>

      <section className="news-content">
        {/* FEATURED */}
        <div className="section-label">
          <span className="section-line blue"></span>
          <span className="section-text">FEATURED</span>
        </div>
        <div className="featured-container">
          {featuredNews.map((item) => (
            <div key={item.id} className="featured-card" 
              style={{ backgroundImage: `url(${getImageUrl(item.image)})`, cursor: 'pointer' }}
              onClick={() => goToNews(item.slug)}>
              <div className="featured-overlay">
                <span className="news-type">{item.theme || 'CHAMPIONSHIP'}</span>
                <h2 className="featured-title">{item.title}</h2>
                <div className="featured-footer">
                  <span className="news-date">{formatDate(item.date)}</span>
                  <span className="read-more-btn">READ MORE ›</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* LATEST NEWS */}
        <div className="section-header">
          <div className="section-label">
            <span className="section-line grey"></span>
            <span className="section-text grey-text">LATEST NEWS</span>
          </div>
          <button className="all-articles-btn">ALL ARTICLES ›</button>
        </div>
        <div className="latest-news-grid">
          {latestNews.map((item) => (
            <div key={item.id} className="news-card" onClick={() => goToNews(item.slug)} style={{ cursor: 'pointer' }}>
              <div className="news-card-image" style={{ backgroundImage: `url(${getImageUrl(item.image)})` }}></div>
              <div className="news-card-content">
                <span className={`news-type type-${item.theme?.toLowerCase() || 'education'}`}>{item.theme}</span>
                <h3 className="news-card-title">{item.title}</h3>
                <p className="news-card-desc">{item.description}</p>
                <span className="news-card-date">{formatDate(item.date)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* VIDEOS */}
        <div className="section-header">
          <div className="section-label">
            <span className="section-line blue"></span>
            <span className="section-text">VIDEOS</span>
          </div>
          <button className="all-articles-btn">ALL VIDEOS ›</button>
        </div>
        <div className="videos-grid">
          {videos.slice(0, 4).map((v) => (
            <div key={v.id} className="video-card" onClick={() => v.videoUrl && window.open(v.videoUrl, '_blank')} style={{ cursor: 'pointer' }}>
              <div className="video-thumbnail" style={{ backgroundImage: `url(${getImageUrl(v.thumbnail)})` }}>
                <div className="video-play-btn"><i className="fa-solid fa-play"></i></div>
                <span className="video-duration">{v.duration || '4:38'}</span>
              </div>
              <div className="video-info">
                <span className="video-label">VIDEO</span>
                <h3 className="video-title">{v.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* LIVE STREAMS */}
        {streams.length > 0 && (
          <div className="live-block">
            <div className="live-header">
              <span className="live-dot"></span>
              <span className="live-text">LIVE NOW</span>
              <span className="live-streams">{streams.filter(s => s.streamStatus === 'live').length} streams</span>
            </div>
            <div className="live-grid">
              {mainStream && (
                <div className="live-card-main" style={{ backgroundImage: `url(${getImageUrl(mainStream.thumbnail)})` }}>
                  <div className="live-card-top">
                    <div className={`platform-badge ${platformClass(mainStream.platform)}`}>
                      <i className={`fa-brands fa-${mainStream.platform}`}></i>
                      <span>{mainStream.platform}</span>
                    </div>
                    <div className="live-pill">
                      <div className="live-pill-status">
                        <span className="live-pill-dot"></span>
                        <span className="live-pill-text">{mainStream.streamStatus?.toUpperCase()}</span>
                      </div>
                      <div className="live-pill-stats">
                        <i className="fa-regular fa-eye"></i>
                        <span className="views-count">{mainStream.views}</span>
                        <span className="stat-separator">·</span>
                        <span className="duration">{mainStream.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="live-play-btn" onClick={() => window.open(mainStream.url, '_blank')}>
                    <i className="fa-solid fa-play"></i>
                  </div>
                  <div className="live-card-bottom">
                    <span className="live-event">{mainStream.eventName}</span>
                    <h3 className="live-title">{mainStream.title}</h3>
                    <button className={`watch-btn ${platformClass(mainStream.platform)}-btn`} onClick={() => window.open(mainStream.url, '_blank')}>
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      WATCH ON {mainStream.platform?.toUpperCase()}
                    </button>
                  </div>
                </div>
              )}
              <div className="live-right-column">
                {sideStreams.map((s) => (
                  <div key={s.id} className="live-card-small" style={{ backgroundImage: `url(${getImageUrl(s.thumbnail)})` }}>
                    <div className="live-card-top">
                      <div className={`platform-badge ${platformClass(s.platform)}`}>
                        <i className={`fa-brands fa-${s.platform}`}></i>
                        <span>{s.platform}</span>
                      </div>
                      <div className="live-pill live-pill-small">
                        <div className="live-pill-status live-pill-status-small">
                          <span className="live-pill-dot"></span>
                          <span className="live-pill-text">{s.streamStatus?.toUpperCase()}</span>
                        </div>
                        <div className="live-pill-stats live-pill-stats-small">
                          <i className="fa-regular fa-eye"></i>
                          <span className="views-count">{s.views}</span>
                          <span className="stat-separator">·</span>
                          <span className="duration">{s.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="live-play-btn-small" onClick={() => window.open(s.url, '_blank')}>
                      <i className="fa-solid fa-play"></i>
                    </div>
                    <div className="live-card-small-content">
                      <span className="live-event-small">{s.eventName}</span>
                      <h4 className="live-title-small">{s.title}</h4>
                      <button className={`watch-btn watch-btn-small ${platformClass(s.platform)}-btn`} onClick={() => window.open(s.url, '_blank')}>
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
        <div className="section-header">
          <div className="section-label">
            <span className="section-line grey"></span>
            <span className="section-text grey-text">PRESS RELEASES</span>
          </div>
        </div>
        <div className="press-divider"></div>
        <div className="press-list">
          {pressReleases.length > 0 ? pressReleases.map((doc) => (
            <div key={doc.id} className="press-item">
              <div className="press-info">
                <h4 className="press-title">{doc.title}</h4>
                <span className="press-meta">{formatDate(doc.date)} · PDF {doc.fileSize || '0.3 MB'}</span>
              </div>
              <button className="download-btn-press" onClick={() => {
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
      </section>
    </>
  );
};

export default MediaPage;