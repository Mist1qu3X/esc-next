'use client';
import { useState, useEffect } from 'react';
import { cachedGet } from '@/lib/apiCache';
import config from '@/lib/config';
import { downloadFile } from '@/lib/download';
import { useRouter } from 'next/navigation';
import StreamPlayer, { canEmbed, ytThumb } from '@/components/StreamPlayer/StreamPlayer';
import LoadingMedia from './LoadingMedia';
import './MediaPage.css';

// GET с повтором при временных сбоях (холодный старт Strapi / сеть).
// Именно из-за них раздел иногда «мигал» пустым состоянием и лечился перезагрузкой.
const getWithRetry = async (url, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    try {
      return await cachedGet(url);
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
};
const EMPTY_RES = { data: { data: [] } };

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
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null); // стрим, открытый во встроенном плеере
  const [savedSlugs, setSavedSlugs] = useState([]);       // сохранённые статьи (localStorage) — их наверх
  // Фильтры/сортировка вкладки PHOTO
  const [photoSearch, setPhotoSearch] = useState('');
  const [photoYear, setPhotoYear] = useState('all');
  const [photoEvent, setPhotoEvent] = useState('all');
  const [photoSort, setPhotoSort] = useState('recent');

  const router = useRouter();

  const filters = ['ALL', 'NEWS', 'FEATURES', 'INTERVIEWS', 'PHOTO', 'VIDEOS', 'PRESS RELEASES'];

  // Предвыбор вкладки из ?filter= (ссылки из хедера/футера)
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('filter');
    if (f && filters.includes(f)) setActiveFilter(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Сохранённые статьи (localStorage) — чтобы поднимать их наверх списка
  useEffect(() => {
    try { setSavedSlugs((JSON.parse(localStorage.getItem('esc-saved-articles') || '[]') || []).map((a) => a?.slug).filter(Boolean)); } catch (e) {}
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Каждый запрос падает независимо: сбой одного (напр. live-streams) больше
        // не обнуляет всю страницу — остальные секции отрисуются нормально.
        const [newsRes, videosRes, docsRes, streamsRes, photosRes] = await Promise.all([
          getWithRetry(`${config.API_URL}/api/news-items?populate=*&sort=date:desc&pagination[pageSize]=100`).catch(() => EMPTY_RES),
          getWithRetry(`${config.API_URL}/api/videos?populate[thumbnail]=true&populate[videoFile]=true&sort=createdAt:desc&pagination[pageSize]=100`).catch(() => EMPTY_RES),
          // docs/streams: только общие (событийные живут на странице события).
          getWithRetry(`${config.API_URL}/api/docs?populate=*&sort=date:desc&pagination[pageSize]=100&filters[eventSlug][$null]=true`).catch(() => EMPTY_RES),
          getWithRetry(`${config.API_URL}/api/live-streams?populate[thumbnail]=true&pagination[pageSize]=10`).catch(() => EMPTY_RES),
          // photos: показываем ВСЕ альбомы (событийные тоже) — в сетке нужна только обложка + счётчик
          getWithRetry(`${config.API_URL}/api/photos?populate[image]=true&populate[images][fields][0]=id&sort=date:desc&pagination[pageSize]=100`).catch(() => EMPTY_RES),
        ]);

        setNews(extractData(newsRes));
        setVideos(extractData(videosRes));
        setDocs(extractData(docsRes));
        setStreams(extractData(streamsRes));
        setPhotos(extractData(photosRes));

        // дозагружаем остальные страницы альбомов в фоне (Strapi капит pageSize на 100)
        (async () => {
          try {
            const pageCount = photosRes.data?.meta?.pagination?.pageCount || 1;
            for (let page = 2; page <= pageCount; page++) {
              const r = await cachedGet(`${config.API_URL}/api/photos?populate[image]=true&populate[images][fields][0]=id&sort=date:desc&pagination[pageSize]=100&pagination[page]=${page}`);
              const batch = extractData(r);
              if (batch.length) setPhotos((prev) => [...prev, ...batch]);
            }
          } catch (_) { /* оставляем то, что успели загрузить */ }
        })();

        // видео: догружаем все страницы (всего их сотни)
        (async () => {
          try {
            const pageCount = videosRes.data?.meta?.pagination?.pageCount || 1;
            for (let page = 2; page <= pageCount; page++) {
              const r = await cachedGet(`${config.API_URL}/api/videos?populate[thumbnail]=true&populate[videoFile]=true&sort=createdAt:desc&pagination[pageSize]=100&pagination[page]=${page}`);
              const batch = extractData(r);
              if (batch.length) setVideos((prev) => [...prev, ...batch]);
            }
          } catch (_) {}
        })();

        // новости: кастомный контроллер отдаёт массив без meta → грузим, пока приходит по 100
        (async () => {
          try {
            for (let page = 2; page <= 30; page++) {
              const r = await cachedGet(`${config.API_URL}/api/news-items?populate=*&sort=date:desc&pagination[pageSize]=100&pagination[page]=${page}`);
              const batch = extractData(r);
              if (!batch.length) break;
              setNews((prev) => [...prev, ...batch]);
              if (batch.length < 100) break;
            }
          } catch (_) {}
        })();

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

  // Видео считается доступным, если есть источник (ссылка или загруженный файл)
  const videoAvailable = (v) => !!(v?.videoUrl || v?.videoFile);

  // Битые/удалённые видео (нет ни обложки, ни залитого файла) — источник удалён/заблокирован
  // на канале, показывать нечего: исключаем из выдачи.
  const videoDisplayable = (v) => !!(getImageUrl(v?.thumbnail) || v?.videoFile);

  // Реальная длительность: в Strapi у всех видео стоит заглушка "0:00" (ютуб-ссылки
  // без Data API). Показываем бейдж только если есть ненулевое время.
  const realDuration = (v) => {
    const d = (v?.duration ?? '').toString().trim();
    return /[1-9]/.test(d) ? d : null;
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

  // Сохранённые статьи — вперёд (только в ALL NEWS). Стабильная сортировка сохраняет порядок по дате.
  const savedFirst = (list) => {
    if (!savedSlugs.length) return list;
    const set = new Set(savedSlugs);
    return [...list].sort((a, b) => (set.has(b.slug) ? 1 : 0) - (set.has(a.slug) ? 1 : 0));
  };
  const isSaved = (slug) => !!slug && savedSlugs.includes(slug);

  const filteredNews = getFilteredNews();
  const featuredNews = filteredNews.slice(0, 2);
  const latestNews = filteredNews.slice(2, 6); // LATEST NEWS — обычный порядок по дате (без saved-first)
  
  // Фильтр для VIDEOS
  const getFilteredVideos = () => {
    if (activeFilter === 'ALL' || activeFilter === 'VIDEOS') {
      return videos.filter(videoDisplayable);
    }
    return [];
  };

  const filteredVideos = getFilteredVideos();

  // Фильтр для PRESS RELEASES: на вкладке — все, на ALL — превью 4
  const getFilteredPressReleases = () => {
    const all = docs.filter((d) => d.theme === 'PRESS RELEASES' || d.theme === 'RELEASES');
    if (activeFilter === 'PRESS RELEASES') return all;
    if (activeFilter === 'ALL') return all.slice(0, 4);
    return [];
  };

  const pressReleases = getFilteredPressReleases();

  const normPlatform = (p) => (p || '').toString().trim().toLowerCase();

  const platformClass = (p) => {
    if (normPlatform(p) === 'facebook') return 'facebook';
    return 'youtube';
  };

  const youtubeStream = streams.find((s) => normPlatform(s.platform) === 'youtube');
  const facebookStream = streams.find((s) => normPlatform(s.platform) === 'facebook');
  let liveStreams = [youtubeStream, facebookStream].filter(Boolean);
  if (liveStreams.length < 2) {
    const rest = streams.filter((s) => !liveStreams.includes(s));
    liveStreams = [...liveStreams, ...rest].slice(0, 2);
  }

  // Тематические разделы (NEWS/FEATURES/INTERVIEWS) — единый список «NEWS» со всеми новостями темы
  const themeView = ['NEWS', 'FEATURES', 'INTERVIEWS'].includes(activeFilter);

  // Проверка, нужно ли показывать секции
  const showFeatured = activeFilter === 'ALL' || themeView; // FEATURED — на ALL и на темах
  const showLatestNews = activeFilter === 'ALL' || themeView;
  const showVideos = activeFilter === 'ALL';          // превью-ряд видео на ALL
  const showVideoGallery = activeFilter === 'VIDEOS'; // отдельная галерея видео (как PHOTO)
  const showLiveStreams = activeFilter === 'ALL' && liveStreams.length > 0; // только если реально идёт эфир
  const showPressReleases = activeFilter === 'ALL' || activeFilter === 'PRESS RELEASES';
  const showPhotos = activeFilter === 'PHOTO';

  // В ALL NEWS (вкладка NEWS) сохранённые статьи ЛЮБОЙ темы — вперёд (иначе сохранённый
  // Interview/Feature отфильтровывался бы по теме и наверх не попадал).
  const savedFirstNews = (themeList) => {
    if (!savedSlugs.length) return themeList;
    const set = new Set(savedSlugs);
    const saved = news.filter((n) => set.has(n.slug));       // сохранённые — любой темы, по дате
    const rest = themeList.filter((n) => !set.has(n.slug));
    return [...saved, ...rest];
  };

  // Новостная сетка: на теме — «ALL N THEME» и ВСЕ новости темы; на ALL — «LATEST NEWS» (обрезка)
  const newsGridItems = activeFilter === 'NEWS'
    ? savedFirstNews(filteredNews)
    : (themeView ? savedFirst(filteredNews) : latestNews);
  const newsGridHeading = themeView ? `ALL ${newsGridItems.length} ${activeFilter}` : 'LATEST NEWS';

  // ---- PHOTO: фильтры (поиск / год / событие) + сортировка + счётчики ----
  const photoCountOf = (p) => (Array.isArray(p.images) && p.images.length > 0 ? p.images.length : (p.photoCount || 0));
  const photoYears = [...new Set(photos.filter((p) => p.date).map((p) => new Date(p.date).getFullYear().toString()))].sort((a, b) => b - a);
  const formatEventName = (slug) => slug.replace(/-\d+$/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const photoEvents = [...new Set(photos.filter((p) => p.eventSlug).map((p) => p.eventSlug))];
  const displayedPhotos = (() => {
    let r = [...photos];
    if (photoSearch.trim()) { const q = photoSearch.toLowerCase(); r = r.filter((p) => (p.title || '').toLowerCase().includes(q)); }
    if (photoYear !== 'all') r = r.filter((p) => p.date && new Date(p.date).getFullYear().toString() === photoYear);
    if (photoEvent !== 'all') r = r.filter((p) => p.eventSlug === photoEvent);
    if (photoSort === 'recent') r.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    else if (photoSort === 'oldest') r.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    else if (photoSort === 'count') r.sort((a, b) => photoCountOf(b) - photoCountOf(a));
    else if (photoSort === 'az') r.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return r;
  })();
  const photoFiltersActive = !!photoSearch.trim() || photoYear !== 'all' || photoEvent !== 'all';
  const resetPhotoFilters = () => { setPhotoSearch(''); setPhotoYear('all'); setPhotoEvent('all'); };
  const photoCountLabel = (n) => (n === 0 ? 'Empty' : n === 1 ? '1 photo' : `${n} photos`);

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
        <LoadingMedia
          variant={
            activeFilter === 'PHOTO' ? 'photo'
              : activeFilter === 'VIDEOS' ? 'video'
              : activeFilter === 'PRESS RELEASES' ? 'press'
              : 'articles'
          }
        />
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
                    {isSaved(item.slug) && <span className="mp-saved-badge"><i className="fa-solid fa-bookmark"></i>Saved</span>}
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
                <div className="mp-empty-block">
                  <i className="fa-regular fa-newspaper mp-empty-block-icon"></i>
                  <p className="mp-empty-block-title">No featured {activeFilter !== 'ALL' ? activeFilter.toLowerCase() : ''} news yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* PHOTO GALLERY */}
        {showPhotos && (
          <div>
            <div className="mp-photo-head-row">
              <h2 className="mp-photo-heading">PHOTO</h2>
              <span className="mp-photo-total">{displayedPhotos.length} ALBUM{displayedPhotos.length === 1 ? '' : 'S'}</span>
            </div>

            {/* Фильтры альбомов: поиск / событие / год / сортировка */}
            {photos.length > 0 && (
              <div className="mp-photo-filters">
                <div className="mp-photo-search">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input type="text" placeholder="Search albums…" value={photoSearch} onChange={(e) => setPhotoSearch(e.target.value)} />
                </div>
                {photoEvents.length > 0 && (
                  <select className="mp-photo-select" value={photoEvent} onChange={(e) => setPhotoEvent(e.target.value)}>
                    <option value="all">All events</option>
                    {photoEvents.map((ev) => <option key={ev} value={ev}>{formatEventName(ev)}</option>)}
                  </select>
                )}
                <select className="mp-photo-select" value={photoYear} onChange={(e) => setPhotoYear(e.target.value)}>
                  <option value="all">All years</option>
                  {photoYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="mp-photo-select" value={photoSort} onChange={(e) => setPhotoSort(e.target.value)}>
                  <option value="recent">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="count">Most photos</option>
                  <option value="az">A–Z</option>
                </select>
              </div>
            )}

            <div className="mp-photo-grid">
              {displayedPhotos.length > 0 ? (
                displayedPhotos.map((p) => {
                  const cover = getImageUrl(p.image) || getImageUrl(p.images);
                  const count = photoCountOf(p);
                  return (
                    <div
                      key={p.id}
                      className="mp-photo-card"
                      onClick={() => p.slug && router.push(`/media/photo/${p.slug}`)}
                      style={{ cursor: p.slug ? 'pointer' : 'default' }}
                    >
                      <div className="mp-photo-cover" style={{ backgroundImage: `url(${cover})` }}>
                        {count === 0 && <span className="mp-photo-empty-badge">Empty</span>}
                      </div>
                      <div className="mp-photo-panel">
                        <h3 className="mp-photo-title">{p.title}</h3>
                        <div className="mp-photo-footer">
                          <span className="mp-photo-date">{formatDatePhoto(p.date)}</span>
                          {/* Одиночное изображение — это не «альбом»: подпись с количеством скрываем */}
                          {count !== 1 && (
                            <span className={`mp-photo-count ${count === 0 ? 'mp-photo-count-empty' : ''}`}>
                              <i className="fa-regular fa-images"></i>{photoCountLabel(count)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="mp-empty-block">
                  <i className="fa-regular fa-images mp-empty-block-icon"></i>
                  <p className="mp-empty-block-title">{photos.length === 0 ? 'No albums yet' : 'No albums match your filters'}</p>
                  {photoFiltersActive && <button className="mp-empty-block-btn" onClick={resetPhotoFilters}>Clear filters</button>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIDEO GALLERY (вкладка VIDEOS — чистое видео, как PHOTO) */}
        {showVideoGallery && (
          <div>
            <h2 className="mp-photo-heading">VIDEOS</h2>
            <div className="mp-photo-grid">
              {filteredVideos.length > 0 ? (
                filteredVideos.map((v) => {
                  const avail = videoAvailable(v);
                  return (
                  <div
                    key={v.id}
                    className={`mp-photo-card ${!avail ? 'mp-video-unavailable' : ''}`}
                    onClick={() => avail && router.push(`/media/video/${v.documentId}`)}
                    style={{ cursor: avail ? 'pointer' : 'default' }}
                  >
                    <div className="mp-vgal-cover" style={{ backgroundImage: `url(${getImageUrl(v.thumbnail)})` }}>
                      {avail ? (
                        <>
                          <div className="mp-vgal-play"><i className="fa-solid fa-play"></i></div>
                          {realDuration(v) && <span className="mp-vgal-duration">{realDuration(v)}</span>}
                        </>
                      ) : (
                        <div className="mp-video-unavail"><i className="fa-solid fa-video-slash"></i><span>Unavailable</span></div>
                      )}
                    </div>
                    <div className="mp-photo-panel">
                      <h3 className="mp-photo-title">{v.title}</h3>
                      <div className="mp-photo-footer">
                        <span className="mp-photo-date">{formatDatePhoto(v.date)}</span>
                      </div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="mp-empty-block">
                  <i className="fa-regular fa-circle-play mp-empty-block-icon"></i>
                  <p className="mp-empty-block-title">No videos yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEWS (на теме — все новости темы; на ALL — LATEST NEWS) */}
        {showLatestNews && (
          <div>
            <div className="mp-section-header" id="latest-news">
              <div className="mp-section-label">
                <span className="mp-section-line mp-grey"></span>
                <span className="mp-section-text mp-grey-text">{newsGridHeading}</span>
              </div>
              {!themeView && (
                <button className="mp-all-articles-btn" onClick={() => { setActiveFilter('NEWS'); setTimeout(() => document.getElementById('latest-news')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120); }}>ALL ARTICLES ›</button>
              )}
            </div>
            <div className="mp-latest-news-grid">
              {newsGridItems.length > 0 ? (
                newsGridItems.map((item) => (
                  <div key={item.id} className="mp-news-card" onClick={() => goToNews(item.slug)} style={{ cursor: 'pointer' }}>
                    <div className="mp-news-card-image" style={{ backgroundImage: `url(${getImageUrl(item.image)})` }}>
                      {isSaved(item.slug) && <span className="mp-saved-badge"><i className="fa-solid fa-bookmark"></i>Saved</span>}
                    </div>
                    <div className="mp-news-card-content">
                      <span className={`mp-news-type mp-type-${item.theme?.toLowerCase() || 'education'}`}>{item.theme || 'NEWS'}</span>
                      <h3 className="mp-news-card-title">{item.title}</h3>
                      <p className="mp-news-card-desc">{item.description}</p>
                      <span className="mp-news-card-date">{formatDate(item.date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mp-empty-block">
                  <i className="fa-regular fa-newspaper mp-empty-block-icon"></i>
                  <p className="mp-empty-block-title">No {activeFilter !== 'ALL' ? activeFilter.toLowerCase() + ' ' : ''}news yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIDEOS */}
        {showVideos && (
          <div>
            <div className="mp-section-header" id="videos">
              <div className="mp-section-label">
                <span className="mp-section-line mp-blue"></span>
                <span className="mp-section-text">VIDEOS</span>
              </div>
              <button className="mp-all-articles-btn" onClick={() => setActiveFilter('VIDEOS')}>ALL VIDEOS ›</button>
            </div>
            <div className="mp-videos-grid">
              {filteredVideos.length > 0 ? (
                filteredVideos.slice(0, 4).map((v) => {
                  const avail = videoAvailable(v);
                  return (
                  <div key={v.id} className={`mp-video-card ${!avail ? 'mp-video-unavailable' : ''}`} onClick={() => avail && router.push(`/media/video/${v.documentId}`)} style={{ cursor: avail ? 'pointer' : 'default' }}>
                    <div className="mp-video-thumbnail" style={{ backgroundImage: `url(${getImageUrl(v.thumbnail)})` }}>
                      {avail ? (
                        <>
                          <div className="mp-video-play-btn"><i className="fa-solid fa-play"></i></div>
                          {realDuration(v) && <span className="mp-video-duration">{realDuration(v)}</span>}
                        </>
                      ) : (
                        <div className="mp-video-unavail"><i className="fa-solid fa-video-slash"></i><span>Unavailable</span></div>
                      )}
                    </div>
                    <div className="mp-video-info">
                      <span className="mp-video-label">VIDEO</span>
                      <h3 className="mp-video-title">{v.title}</h3>
                      {/* дата видна только на мобилке — там карточка приводится к виду галереи VIDEOS */}
                      <span className="mp-video-date">{formatDatePhoto(v.date)}</span>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="mp-empty-block">
                  <i className="fa-regular fa-circle-play mp-empty-block-icon"></i>
                  <p className="mp-empty-block-title">No videos yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIVE STREAMS */}
        {showLiveStreams && streams.length > 0 && (
          <div className="mp-live-block">
            <div className="mp-section-label">
              <span className="mp-section-line mp-grey"></span>
              <span className="mp-section-text mp-grey-text">WATCH</span>
            </div>
            <div className="mp-live-grid">
              {liveStreams.map((s) => {
                const open = () => (canEmbed(s) ? setPlaying(s) : s.url && window.open(s.url, '_blank'));
                // превью: своё залитое, иначе стоп-кадр самого стрима (YouTube)
                const cover = getImageUrl(s.thumbnail) || ytThumb(s.url);
                return (
                <div key={s.id} className={`mp-live-card-main ${platformClass(s.platform)}`} style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
                  {!cover && (
                    <div className="mp-live-cover-fallback" aria-hidden="true">
                      <i className={`fa-brands fa-${platformClass(s.platform)}`}></i>
                    </div>
                  )}
                  <div className="mp-live-card-top">
                    <div className={`mp-platform-badge ${platformClass(s.platform)}`}>
                      <i className={`fa-brands fa-${platformClass(s.platform)}`}></i>
                      <span>{platformClass(s.platform)}</span>
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
                      WATCH
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
                    {doc.description && <p className="mp-press-desc">{doc.description}</p>}
                    <span className="mp-press-meta">{formatDate(doc.date)}{doc.file ? ` · PDF ${doc.fileSize || '0.3 MB'}` : ' · No file attached'}</span>
                  </div>
                  {doc.file ? (
                    <button className="mp-download-btn-press" onClick={() => {
                      const url = doc.file?.url;
                      if (url) downloadFile(url.startsWith('http') ? url : `${config.API_URL}${url}`, `${doc.title || 'document'}${doc.file?.ext || '.pdf'}`);
                    }}>
                      <i className="fa-solid fa-download"></i>DOWNLOAD
                    </button>
                  ) : (
                    <span className="mp-press-nofile"><i className="fa-solid fa-file-circle-xmark"></i>No file</span>
                  )}
                </div>
              )) : (
                <div className="mp-empty-block">
                  <i className="fa-regular fa-file-lines mp-empty-block-icon"></i>
                  <p className="mp-empty-block-title">No {activeFilter !== 'ALL' ? activeFilter.toLowerCase() + ' ' : ''}press releases yet</p>
                </div>
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