'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './SelectedNewsPage.css';

const SelectedNewsPage = ({ slug }) => {
  const [article, setArticle] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setArticle(null);
    setRelatedNews([]);
    setLoading(true);
    
    const fetchArticle = async () => {
      try {
        const res = await axios.get(
          `${config.API_URL}/api/news-items?filters[slug][$eq]=${slug}&populate=*`
        );
        if (res.data?.data?.length > 0) {
          setArticle(res.data.data[0]);
        }
        setLoading(false);
      } catch (e) { 
        console.error(e); 
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  useEffect(() => {
    if (!article) return;
    const fetchRelated = async () => {
      try {
        const res = await axios.get(
          `${config.API_URL}/api/news-items?populate=*&pagination[limit]=4&sort=date:desc&filters[id][$ne]=${article.id}`
        );
        setRelatedNews(res.data?.data || []);
      } catch (e) { console.error(e); }
    };
    fetchRelated();
  }, [article]);

  if (!article) {
    return (
      <section className="selected_media_head" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff', fontSize: '20px' }}>Loading...</p>
      </section>
    );
  }

  const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
    return img.url?.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
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
    };

    return (
    <>
      {/* ========== HERO ========== */}
      <section className="selected_media_head" style={{ backgroundImage: `url(${getImageUrl(article.image)})` }}>
        <div className="selected-media-overlay"></div>
        <div className="selected-breadcrumbs">
          <span className="selected-breadcrumb">HOME</span>
          <span className="selected-breadcrumb-separator">›</span>
          <span className="selected-breadcrumb">MEDIA</span>
          <span className="selected-breadcrumb-separator">›</span>
          <span className="selected-breadcrumb-active">{article.theme}</span>
        </div>
        <div className="selected-media-content">
          <div className="selected-meta-row">
            <span className="selected-type">{article.theme}</span>
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

      {/* ========== CONTENT ========== */}
      <section className="media_main_content">
        <div className="media-content-wrapper">
          <div className="media-article-body">
            {/* Подзаголовок */}
            {article.subtitle && (
              <>
                <p className="article-subtitle">{article.subtitle}</p>
                <div className="article-divider"></div>
              </>
            )}

            {/* Основной контент */}
            {article.content && article.content.split('\n\n').map((block, i) => {
              // Цитата в кавычках
              if (block.startsWith('"') && block.endsWith('"')) {
                return (
                  <blockquote key={i} className="article-quote">
                    <p>{block.slice(1, -1)}</p>
                  </blockquote>
                );
              }
              
              // Заголовок (короткие строки без точек в UpperCase)
              const isHeading = block === block.toUpperCase() && block.length < 60 && !block.includes('.');
              if (isHeading) {
                return <h2 key={i} className="article-heading">{block}</h2>;
              }
              
              // Обычный параграф
              return <p key={i} className="article-text">{block}</p>;
            })}
            
            {/* Если нет контента */}
            {!article.content && (
              <p className="article-text">{article.description}</p>
            )}

            <div className="article-divider"></div>
            
            {/* Теги */}
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

            {/* Share */}
            <div className="article-share">
              <span className="share-label">SHARE THIS ARTICLE</span>
              <div className="share-buttons">
                <button className="share-btn-item twitter" onClick={handleShareTwitter}>
                    <i className="fa-solid fa-share-nodes"></i>
                    TWITTER
                </button>
                <button className="share-btn-item linkedin" onClick={handleShareLinkedIn}>
                    <i className="fa-solid fa-share-nodes"></i>
                    LINKEDIN
                </button>
                <button className="share-btn-item copy" onClick={handleCopyLink}>
                    <i className="fa-solid fa-share-nodes"></i>
                    COPY LINK
                </button>
                </div>
            </div>
          </div>

          {/* ========== SIDEBAR ========== */}
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
                  <div key={n.id} className="related-item">
                    <img src={getImageUrl(n.image)} alt={n.title} className="related-img" />
                    <div className="related-info">
                      <span className={`related-type type-${n.theme?.toLowerCase() || 'event'}`}>{n.theme}</span>
                      <h5 className="related-title">{n.title}</h5>
                    </div>
                  </div>
                ))}
              </div>
              <div className="related-divider"></div>
              <button className="all-media-btn">ALL MEDIA ›</button>
            </div>

            <button className="back-to-media-btn"><i className="fa-solid fa-arrow-left"></i>BACK TO MEDIA</button>
          </aside>
        </div>
      </section>
    </>
  );
};

export default SelectedNewsPage;