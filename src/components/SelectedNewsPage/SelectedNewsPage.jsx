'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import { useRouter } from 'next/navigation';
import ErrorPage from '@/components/ErrorPage/ErrorPage';
import './SelectedNewsPage.css';

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
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();

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
        const res = await axios.get(
          `${config.API_URL}/api/news-items?filters[slug][$eq]=${slug}&populate=*`
        );
        
        // Извлекаем данные (универсально)
        const articles = extractData(res);
        
        if (articles.length > 0) {
          const articleData = articles[0];
          setArticle(articleData);
          
          // Получаем похожие новости
          const relatedRes = await axios.get(
            `${config.API_URL}/api/news-items?populate=*&limit=4&sort=date:desc`
          );
          const related = extractData(relatedRes);
          // Фильтруем текущую статью
          setRelatedNews(related.filter(item => item.id !== articleData.id));
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  const handleAllMedia = () => {
    router.push('/media');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleRelatedClick = (relatedSlug) => {
    if (relatedSlug) {
      router.push(`/media/${relatedSlug}`);
    }
  };

  const formatContent = (content) => {
    if (!content) return null;
    const blocks = content.split('\n\n');
    return blocks.map((block, i) => {
      if (block.startsWith('"') && block.endsWith('"')) {
        return (
          <blockquote key={i} className="article-quote">
            <p>{block.slice(1, -1)}</p>
          </blockquote>
        );
      }
      const isHeading = block === block.toUpperCase() && block.length < 60 && !block.includes('.');
      if (isHeading) {
        return <h2 key={i} className="article-heading">{block}</h2>;
      }
      return <p key={i} className="article-text">{block}</p>;
    });
  };

  if (loading) {
    return (
      <section className="selected_media_head" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="media-loader">
          <div className="loader-spinner"></div>
          <p style={{ color: '#fff', fontSize: '20px', marginTop: '20px' }}>Loading article...</p>
        </div>
      </section>
    );
  }

  if (notFound || !article) {
    return <ErrorPage />;
  }

  return (
    <>
      <section className="selected_media_head" style={{ backgroundImage: `url(${getImageUrl(article.image) || '/img/fallback-news.jpg'})` }}>
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

            {formatContent(article.content)}
            
            {!article.content && article.description && (
              <p className="article-text">{article.description}</p>
            )}

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
                <button className="share-btn-item copy" onClick={handleCopyLink}>
                  <i className="fa-regular fa-copy"></i>
                  COPY LINK
                </button>
              </div>
            </div>
          </div>

          <aside className="media-sidebar">
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">ARTICLE ACTIONS</h4>
              <div className="sidebar-actions">
                <button className="action-btn save-btn"><i className="fa-regular fa-bookmark"></i>SAVE ARTICLE</button>
                <button className="action-btn share-btn"><i className="fa-solid fa-share-nodes"></i>SHARE</button>
              </div>
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
                    <img src={getImageUrl(n.image) || '/img/fallback-news.jpg'} alt={n.title} className="related-img" />
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
          </aside>
        </div>
      </section>
    </>
  );
};

export default SelectedNewsPage;