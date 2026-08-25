'use client';
import { useState, useEffect } from 'react';
import { cachedGet } from '@/lib/apiCache';
import config from '@/lib/config';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ErrorPage from '@/components/ErrorPage/ErrorPage';
import NewsDetailSkeleton from './NewsDetailSkeleton';
import './SelectedNewsPage.css';

// Поле content — Strapi richtext (Markdown). Легаси-статьи писались без markdown:
// строка целиком в кавычках = пул-квоут, короткая КАПС-строка = заголовок.
// Приводим их к markdown, чтобы старые статьи выглядели как раньше, а новые
// могли использовать полноценный markdown (жирный, картинки, ссылки, списки…).
const normalizeLegacy = (content) =>
  (content || '')
    .split('\n\n')
    .map((block) => {
      const b = block.trim();
      if (b.length > 1 && b.startsWith('"') && b.endsWith('"')) {
        return `> ${b.slice(1, -1)}`;
      }
      if (b.length > 0 && b.length < 60 && b === b.toUpperCase() && !b.includes('.') && /[A-Z]/.test(b)) {
        return `## ${b}`;
      }
      return block;
    })
    .join('\n\n');

// Маппинг markdown-узлов на существующие классы статьи.
const mdComponents = {
  p: (props) => <p className="article-text" {...props} />,
  h1: (props) => <h2 className="article-heading" {...props} />,
  h2: (props) => <h2 className="article-heading" {...props} />,
  h3: (props) => <h3 className="article-heading" {...props} />,
  blockquote: (props) => <blockquote className="article-quote" {...props} />,
  a: (props) => <a target="_blank" rel="noopener noreferrer" {...props} />,
  img: ({ node, ...props }) => (
    <img className="article-image" loading="lazy" decoding="async" alt={props.alt || ''} {...props} />
  ),
};

// Универсальная функция для извлечения данных
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

const SelectedNewsPage = ({ slug }) => {
  const [article, setArticle] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [prevArticle, setPrevArticle] = useState(null); // старее (опубликовано раньше)
  const [nextArticle, setNextArticle] = useState(null); // новее (опубликовано позже)
  const [loading, setLoading] = useState(true);
  const [animDone, setAnimDone] = useState(false); // мишень доиграла
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);       // подтверждение «ссылка скопирована»
  const [saved, setSaved] = useState(false);         // статья сохранена (localStorage)
  const router = useRouter();

  const SAVED_KEY = 'esc-saved-articles';
  const readSaved = () => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]').filter((a) => a && a.slug); }
    catch { return []; }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setLoading(false);
        setNotFound(true);
        return;
      }
      
      setLoading(true);
      setNotFound(false);
      
      try {
        // Получаем статью по slug
        const res = await cachedGet(
          `${config.API_URL}/api/news-items?filters[slug][$eq]=${slug}&populate=*`
        );
        
        // Извлекаем данные (универсально)
        const articles = extractData(res);
        
        if (articles.length > 0) {
          const articleData = articles[0];
          setArticle(articleData);
          setSaved(readSaved().some((a) => a.slug === slug));

          // Полный отсортированный список — для соседей (prev/next) и «похожих»
          const listRes = await cachedGet(
            `${config.API_URL}/api/news-items?populate=*&sort=date:desc&pagination[pageSize]=100`
          );
          const list = extractData(listRes);
          const idx = list.findIndex((n) => n.id === articleData.id || n.slug === articleData.slug);
          if (idx !== -1) {
            setNextArticle(idx > 0 ? list[idx - 1] : null);                 // выше в ленте = новее
            setPrevArticle(idx < list.length - 1 ? list[idx + 1] : null);   // ниже в ленте = старее
          }
          setRelatedNews(list.filter((item) => item.id !== articleData.id));
        } else {
          setArticle(null);
          setNotFound(true);
        }
      } catch (e) { 
        console.error('Error fetching article:', e); 
        setArticle(null);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
    if (img.url) return img.url.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
    return null;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article?.title || '')}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  // Копирование ссылки с подтверждением прямо в UI (без alert)
  const handleCopyLink = () => {
    try { navigator.clipboard?.writeText(shareUrl); } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Сохранение статьи без авторизации — localStorage, у каждого своё на устройстве
  const toggleSave = () => {
    const list = readSaved();
    const exists = list.some((a) => a.slug === slug);
    const next = exists
      ? list.filter((a) => a.slug !== slug)
      : [{ slug, title: article?.title, date: article?.date, theme: article?.theme, image: getImageUrl(article?.image) }, ...list];
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch (e) {}
    setSaved(!exists);
  };

  // Нативный шэр (мобилки) с фолбэком на копирование + подтверждением
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article?.title || document.title, url: shareUrl }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleAllMedia = () => {
    router.push('/media');
  };

  const handleGoBack = () => {
    router.back();
  };

  const goToArticle = (a) => {
    if (a?.slug) router.push(`/media/${a.slug}`);
  };

  const handleRelatedClick = (relatedSlug) => {
    if (relatedSlug) {
      router.push(`/media/${relatedSlug}`);
    }
  };

  if (loading || !animDone) {
    return <NewsDetailSkeleton onEnded={() => setAnimDone(true)} />;
  }

  if (notFound || !article) {
    return <ErrorPage />;
  }

  return (
    <>
      <section className="selected_media_head" style={{ backgroundImage: `url(${getImageUrl(article.image) || '/img/fallback-news.svg'})` }}>
        <div className="selected-media-overlay"></div>
        <div className="selected-breadcrumbs">
          <span className="selected-breadcrumb" onClick={handleAllMedia} style={{ cursor: 'pointer' }}>HOME</span>
          <span className="selected-breadcrumb-separator">›</span>
          <span className="selected-breadcrumb" onClick={handleAllMedia} style={{ cursor: 'pointer' }}>MEDIA</span>
          <span className="selected-breadcrumb-separator">›</span>
          <span className="selected-breadcrumb-active">{article.theme || 'NEWS'}</span>
        </div>
        <div className="selected-media-content">
          <div className="selected-meta-row">
            <span className="selected-type">{article.theme || 'NEWS'}</span>
            <span className="selected-read-time"><i className="fa-regular fa-clock"></i>{article.readTime || '4 min read'}</span>
          </div>
          <h1 className="selected-title">{article.title}</h1>
          <div className="selected-info-row">
            <span className="selected-date">{formatDate(article.date)}</span>
            <span className="selected-separator">·</span>
            <span className="selected-author">By {article.author || 'ESC Communications'}</span>
          </div>
        </div>
      </section>

      <section className="media_main_content">
        <div className="media-content-wrapper">
          <div className="media-article-body">
            {article.subtitle && (
              <>
                <p className="article-subtitle">{article.subtitle}</p>
                <div className="article-divider"></div>
              </>
            )}

            {article.content ? (
              <div className="article-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {normalizeLegacy(article.content)}
                </ReactMarkdown>
              </div>
            ) : article.description ? (
              <p className="article-text">{article.description}</p>
            ) : null}

            <div className="article-divider"></div>
            
            {article.tags && (
              <>
                <div className="article-tags">
                  {article.tags.split(',').map((tag, i) => (
                    <button key={i} className={`tag-btn ${i === 0 ? 'active' : ''}`}>#{tag.trim()}</button>
                  ))}
                </div>
                <div className="article-divider"></div>
              </>
            )}

            <div className="article-share">
              <span className="share-label">SHARE THIS ARTICLE</span>
              <div className="share-buttons">
                <button className="share-btn-item twitter" onClick={handleShareTwitter}>
                  <i className="fa-brands fa-twitter"></i>
                  TWITTER
                </button>
                <button className="share-btn-item linkedin" onClick={handleShareLinkedIn}>
                  <i className="fa-brands fa-linkedin-in"></i>
                  LINKEDIN
                </button>
                <button className={`share-btn-item copy ${copied ? 'copied' : ''}`} onClick={handleCopyLink}>
                  <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  {copied ? 'COPIED!' : 'COPY LINK'}
                </button>
              </div>
            </div>
          </div>

          <aside className="media-sidebar">
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">ARTICLE ACTIONS</h4>
              <div className="sidebar-actions">
                <button className={`action-btn save-btn ${saved ? 'saved' : ''}`} onClick={toggleSave} aria-pressed={saved}>
                  <i className={`${saved ? 'fa-solid' : 'fa-regular'} fa-bookmark`}></i>{saved ? 'SAVED' : 'SAVE ARTICLE'}
                </button>
                <button className="action-btn share-btn" onClick={handleShare}><i className="fa-solid fa-share-nodes"></i>SHARE</button>
              </div>
              {saved && <p className="save-hint">Saved on this device · click again to remove</p>}
            </div>

            <div className="sidebar-block">
              <h4 className="sidebar-block-title">ARTICLE INFO</h4>
              <div className="info-list">
                <div className="info-row"><span className="info-label">Published</span><span className="info-value">{formatDate(article.date)}</span></div>
                <div className="info-divider"></div>
                <div className="info-row"><span className="info-label">Category</span><span className="info-value">{article.theme}</span></div>
                <div className="info-divider"></div>
                <div className="info-row"><span className="info-label">Author</span><span className="info-value">{article.author || 'ESC Communications'}</span></div>
                <div className="info-divider"></div>
                <div className="info-row"><span className="info-label">Read Time</span><span className="info-value">{article.readTime || '4 min read'}</span></div>
              </div>
            </div>

            <div className="sidebar-block">
              <h4 className="sidebar-block-title">RELATED ARTICLES</h4>
              <div className="related-list">
                {relatedNews.slice(0, 2).map((n) => (
                  <div 
                    key={n.id} 
                    className="related-item"
                    onClick={() => handleRelatedClick(n.slug)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={getImageUrl(n.image) || '/img/fallback-news.svg'} alt={n.title} className="related-img" loading="lazy" decoding="async" />
                    <div className="related-info">
                      <span className={`related-type type-${n.theme?.toLowerCase() || 'event'}`}>{n.theme || 'NEWS'}</span>
                      <h5 className="related-title">{n.title}</h5>
                    </div>
                  </div>
                ))}
              </div>
              <div className="related-divider"></div>
              <button className="all-media-btn" onClick={handleAllMedia}>ALL MEDIA ›</button>
            </div>

            <button className="back-to-media-btn" onClick={handleGoBack}>
              <i className="fa-solid fa-arrow-left"></i>BACK TO MEDIA
            </button>

            {(prevArticle || nextArticle) && (
              <nav className="sidebar-nav">
                {prevArticle && (
                  <button className="sidebar-nav-item" onClick={() => goToArticle(prevArticle)}>
                    <span className="sidebar-nav-dir"><i className="fa-solid fa-arrow-left"></i> Previous article</span>
                    <span className="sidebar-nav-title">{prevArticle.title}</span>
                  </button>
                )}
                {nextArticle && (
                  <button className="sidebar-nav-item" onClick={() => goToArticle(nextArticle)}>
                    <span className="sidebar-nav-dir">Next article <i className="fa-solid fa-arrow-right"></i></span>
                    <span className="sidebar-nav-title">{nextArticle.title}</span>
                  </button>
                )}
              </nav>
            )}
          </aside>
        </div>
      </section>
    </>
  );
};

export default SelectedNewsPage;