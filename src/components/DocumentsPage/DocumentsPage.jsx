'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import Pagination from '@/components/Pagination/Pagination';
import './DocumentsPage.css';

const DOCS_PER_PAGE = 8;

const DocumentsPage = ({ embedded = false, eventSlug = null }) => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All Documents');
  const [activeYear, setActiveYear] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('Most Recent');
  const [categories, setCategories] = useState([]);
  const [years, setYears] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      const deepPopulate =
        'populate[file]=true&populate[attachments][populate]=file';
      // событие → только его документы; общая библиотека → только не-событийные
      const eventFilter = eventSlug ? `&filters[eventSlug][$eq]=${eventSlug}` : `&filters[eventSlug][$null]=true`;
      const pageUrl = (populate, page) =>
        `${config.API_URL}/api/docs?${populate}${eventFilter}&sort=date:desc&pagination[pageSize]=100&pagination[page]=${page}`;
      const extract = (res) => res.data?.data || (Array.isArray(res.data) ? res.data : []);

      try {
        // Грузим ВСЕ документы постранично (Strapi капит pageSize на 100)
        let populate = deepPopulate;
        let first;
        try {
          first = await axios.get(pageUrl(deepPopulate, 1));
        } catch {
          populate = 'populate=*'; // фолбэк, если бэкенд ещё не знает про attachments
          first = await axios.get(pageUrl('populate=*', 1));
        }
        let docs = extract(first);
        const pageCount = first.data?.meta?.pagination?.pageCount || 1;
        for (let page = 2; page <= pageCount; page++) {
          const res = await axios.get(pageUrl(populate, page));
          docs = docs.concat(extract(res));
        }

        setDocuments(docs);
        setFilteredDocs(docs);

        // Подсчет категорий из реальных данных
        const categoryMap = new Map();
        categoryMap.set('All Documents', docs.length);
        docs.forEach((doc) => {
          const theme = doc.theme || 'Other';
          categoryMap.set(theme, (categoryMap.get(theme) || 0) + 1);
        });
        setCategories(
          Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
        );

        // Подсчет годов из реальных данных
        const yearMap = new Map();
        docs.forEach((doc) => {
          if (doc.date) {
            const year = new Date(doc.date).getFullYear().toString();
            yearMap.set(year, (yearMap.get(year) || 0) + 1);
          }
        });
        setYears(Array.from(yearMap.keys()).sort((a, b) => b - a));
      } catch (e) {
        console.error('Ошибка загрузки документов:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventSlug]);

  // Фильтрация
  useEffect(() => {
    let result = [...documents];

    if (activeCategory !== 'All Documents') {
      result = result.filter((doc) => doc.theme === activeCategory);
    }

    if (activeYear && activeYear !== 'all') {
      result = result.filter((doc) => {
        if (!doc.date) return false;
        return new Date(doc.date).getFullYear().toString() === activeYear;
      });
    }

    if (searchTerm) {
      result = result.filter(
        (doc) =>
          doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.theme?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortOrder === 'Most Recent') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOrder === 'Most Downloaded') {
      result.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sortOrder === 'Alphabetical') {
      result.sort((a, b) => a.title?.localeCompare(b.title));
    }

    setFilteredDocs(result);
    setCurrentPage(1);
  }, [activeCategory, activeYear, searchTerm, sortOrder, documents]);

  // Пагинация
  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / DOCS_PER_PAGE));
  const pageDocs = filteredDocs.slice(
    (currentPage - 1) * DOCS_PER_PAGE,
    currentPage * DOCS_PER_PAGE
  );


  // По умолчанию раскрываем первый документ на странице
  useEffect(() => {
    setExpandedId(pageDocs.length > 0 ? pageDocs[0].id : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filteredDocs]);

  const fileUrl = (file) =>
    file?.url ? (file.url.startsWith('http') ? file.url : `${config.API_URL}${file.url}`) : null;

  const openFile = (file) => {
    const url = fileUrl(file);
    if (url) window.open(url, '_blank');
  };

  const formatMonthYear = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Список файлов внутри документа: либо attachments, либо сам документ как один файл
  const getAttachments = (doc) => {
    if (Array.isArray(doc.attachments) && doc.attachments.length > 0) {
      return doc.attachments;
    }
    return [
      {
        name: doc.title,
        version: doc.version,
        date: doc.date,
        fileSize: doc.fileSize,
        downloadCount: doc.downloadCount,
        file: doc.file,
      },
    ];
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <>
      {/* ========== DOCUMENTS HERO ========== */}
      {!embedded && (
      <section className="documents-hero">
        <div className="breadcrumbs-row">
          <span className="breadcrumb-home">HOME</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">DOCUMENTS</span>
        </div>
        <div className="next-layer">
          <span className="breadcrumb-line"></span>
          <span className="breadcrumb-subtitle">KNOWLEDGE LIBRARY</span>
        </div>
        <h1 className="documents-title">DOCUMENTS LIBRARY</h1>
        <div className="documents-search">
          <i className="fa-solid fa-magnifying-glass documents-search-icon"></i>
          <input
            type="text"
            className="documents-search-field"
            placeholder="Search documents by title, category, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>
      )}

      {/* ========== MAIN CONTENT ========== */}
      {(!embedded && loading) ? (
      <section className="twist-container">
        <aside className="twist-sidebar">
          <div className="sidebar-categories">
            <p className="sidebar-heading">CATEGORIES</p>
            <div className="category-list">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="category-item" key={i} style={{ pointerEvents: 'none' }}>
                  <span className="skeleton" style={{ width: `${52 + (i % 3) * 12}%`, height: 13, borderRadius: 3, display: 'inline-block' }}></span>
                  <span className="skeleton" style={{ width: 20, height: 13, borderRadius: 3, display: 'inline-block' }}></span>
                </div>
              ))}
            </div>
          </div>
          <div className="sidebar-year">
            <p className="sidebar-heading">YEAR</p>
            <div className="year-buttons">
              {Array.from({ length: 5 }).map((_, i) => <span className="skeleton" key={i} style={{ width: 48, height: 30, borderRadius: 4, display: 'inline-block' }}></span>)}
            </div>
          </div>
        </aside>
        <div className="twist-main">
          <div className="docs-top">
            <span className="skeleton" style={{ width: 120, height: 14, borderRadius: 3, display: 'inline-block' }}></span>
            <span className="skeleton" style={{ width: 140, height: 34, borderRadius: 4, display: 'inline-block' }}></span>
          </div>
          <div className="docs-accordion">
            {Array.from({ length: 7 }).map((_, i) => (
              <div className="docs-acc-item" key={i} style={{ pointerEvents: 'none' }}>
                <div className="docs-acc-header">
                  <span className="skeleton" style={{ width: `${45 + (i % 4) * 10}%`, height: 16, borderRadius: 3, display: 'inline-block' }}></span>
                  <span className="skeleton" style={{ width: 16, height: 16, borderRadius: 3, display: 'inline-block' }}></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      ) : (embedded && !loading && documents.length === 0) ? (
      <div className="stream-scheduled" style={{ maxWidth: 480, margin: '40px auto' }}>
        <i className="fa-regular fa-clock stream-scheduled-icon"></i>
        <span className="stream-scheduled-title">DOCUMENTS PENDING</span>
        <span className="stream-scheduled-text">Official documents will appear here once the competition is complete.</span>
      </div>
      ) : (
      <section className="twist-container">
        {/* Левый сайдбар */}
        <aside className="twist-sidebar">
          <div className="sidebar-categories">
            <p className="sidebar-heading">CATEGORIES</p>
            <div className="category-list">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  <span className="category-name">{cat.name}</span>
                  <span className="category-count">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="sidebar-year">
            <p className="sidebar-heading">YEAR</p>
            <div className="year-buttons">
              <button
                key="all"
                className={`year-btn ${activeYear === 'all' ? 'active' : ''}`}
                onClick={() => setActiveYear('all')}
              >
                ALL
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  className={`year-btn ${activeYear === year ? 'active' : ''}`}
                  onClick={() => setActiveYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Правая часть — аккордеон документов */}
        <div className="twist-main">
          <div className="docs-top">
            <span className="docs-count">{filteredDocs.length} DOCUMENTS</span>
            <div className="docs-sort">
              <select
                className="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option>Most Recent</option>
                <option>Most Downloaded</option>
                <option>Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="docs-accordion">
            {pageDocs.length > 0 ? (
              pageDocs.map((doc) => {
                const isOpen = expandedId === doc.id;
                const attachments = getAttachments(doc);
                return (
                  <div className={`docs-acc-item ${isOpen ? 'open' : ''}`} key={doc.id}>
                    <button
                      className="docs-acc-header"
                      onClick={() => toggleExpand(doc.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="docs-acc-title">{doc.title}</span>
                      <i
                        className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} docs-acc-chevron`}
                      ></i>
                    </button>

                    {isOpen && (
                      <div className="docs-acc-body">
                        {doc.description && (
                          <p className="docs-acc-desc">{doc.description}</p>
                        )}
                        <div className="docs-acc-files">
                          {attachments.map((att, i) => (
                            <div className="docs-file" key={i}>
                              <i className="fa-regular fa-file-lines docs-file-icon"></i>
                              <div className="docs-file-info">
                                <span className="docs-file-name">{att.name}</span>
                                <span className="docs-file-meta">
                                  {att.fileSize || '—'} · {att.downloadCount || 0} downloads
                                </span>
                                <span className="docs-file-meta-mobile">
                                  {formatMonthYear(att.date)}{att.fileSize ? ` · ${att.fileSize}` : ''}
                                </span>
                              </div>
                              <span className="docs-file-version">{att.version}</span>
                              <span className="docs-file-date">{formatMonthYear(att.date)}</span>
                              <button
                                className="docs-file-pdf"
                                onClick={() => openFile(att.file)}
                              >
                                <i className="fa-solid fa-download"></i>
                                PDF
                              </button>
                              <button
                                className="docs-file-view"
                                onClick={() => openFile(att.file)}
                                aria-label="View"
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="docs-empty">No documents found</p>
            )}
          </div>

          <Pagination page={currentPage} pageCount={totalPages} onChange={setCurrentPage} />
        </div>
      </section>
      )}
    </>
  );
};

export default DocumentsPage;
