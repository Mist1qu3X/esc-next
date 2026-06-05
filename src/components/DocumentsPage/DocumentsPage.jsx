'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './DocumentsPage.css';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All Documents');
  const [activeYear, setActiveYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('Most Recent');

  const categories = [
    { name: 'All Documents', count: 48 },
    { name: 'Official Documents', count: 12 },
    { name: 'Rules', count: 8 },
    { name: 'Assemblies', count: 9 },
    { name: 'Sustainability', count: 4 },
    { name: 'Newsletters', count: 7 },
    { name: 'Courses', count: 8 },
  ];

  const years = ['2026', '2025', '2024', '2023'];

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(
          `${config.API_URL}/api/docs?populate=*&sort=date:desc&pagination[limit]=100`
        );
        setDocuments(res.data.data);
        setFilteredDocs(res.data.data);
      } catch (e) {
        console.error('Ошибка загрузки документов:', e);
      }
    };
    fetchDocuments();
  }, []);

  // Фильтрация
  useEffect(() => {
    let result = [...documents];

    // По категории
    if (activeCategory !== 'All Documents') {
      result = result.filter((doc) => doc.theme === activeCategory);
    }

    // По году
    if (activeYear) {
      result = result.filter((doc) => {
        const docYear = new Date(doc.date).getFullYear().toString();
        return docYear === activeYear;
      });
    }

    // По поиску
    if (searchTerm) {
      result = result.filter(
        (doc) =>
          doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.theme?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Сортировка
    if (sortOrder === 'Most Recent') {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOrder === 'Most Downloaded') {
      result.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    } else if (sortOrder === 'Alphabetical') {
      result.sort((a, b) => a.title?.localeCompare(b.title));
    }

    setFilteredDocs(result);
  }, [activeCategory, activeYear, searchTerm, sortOrder, documents]);

  const handleDownload = (doc) => {
    const file = doc.file;
    if (file?.url) {
      window.open(file.url.startsWith('http') ? file.url : `${config.API_URL}${file.url}`, '_blank');
    }
  };

  const handleView = (doc) => {
    const file = doc.file;
    if (file?.url) {
      window.open(file.url.startsWith('http') ? file.url : `${config.API_URL}${file.url}`, '_blank');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Featured — первые 3
  const featuredDocs = filteredDocs.slice(0, 3);
  // All documents
  const allDocs = filteredDocs;

  return (
    <>
      {/* ========== DOCUMENTS HERO ========== */}
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

      {/* ========== MAIN CONTENT ========== */}
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

        {/* Правая часть */}
        <div className="twist-main">
          {/* Featured Documents */}
          <section className="featured-documents">
            <div className="documents-top">
              <span className="documents-count">{filteredDocs.length} DOCUMENTS</span>
              <div className="documents-sort">
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
            <div className="documents-naming">
              <div className="documents-line blue"></div>
              <span className="documents-featured">FEATURED</span>
            </div>
            <div className="document-container">
              {featuredDocs.map((doc) => (
                <div key={doc.id} className={`document type-${doc.theme?.toLowerCase().replace(/\s/g, '-') || 'official'}`}>
                  <i className="fa-regular fa-file-pdf document-icon-top"></i>
                  <div className="document-content">
                    <div className="doc-header">
                      <div className="doc-type-tag">{doc.theme || 'OFFICIAL DOCUMENTS'}</div>
                      <span className="doc-version">{doc.version || 'v1.0'}</span>
                    </div>
                    <h3 className="document-title">{doc.title}</h3>
                    <p className="document-description">{doc.description || ''}</p>
                    <div className="document-footer">
                      <div className="document-meta">
                        <span className="doc-date">{formatDate(doc.date)}</span>
                        <span className="doc-size">{doc.fileSize || '1.0 MB'}</span>
                      </div>
                      <button className="download-btn" onClick={() => handleDownload(doc)}>
                        <i className="fa-solid fa-download"></i>
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* All Documents Table */}
          <section className="all-documents">
            <div className="documents-naming">
              <div className="documents-line grey"></div>
              <span className="documents-all">ALL DOCUMENTS</span>
            </div>
            <div className="events-table-wrapper">
              <div className="events-table-header">
                <div className="col col-doc">DOCUMENT</div>
                <div className="col col-category">CATEGORY</div>
                <div className="col col-version">VERSION</div>
                <div className="col col-date">DATE</div>
                <div className="col col-actions">ACTIONS</div>
              </div>
              {allDocs.map((doc) => (
                <div className="events-table-row" key={doc.id}>
                  <div className="col col-doc">
                    <div className="doc-info">
                      <i className="fa-regular fa-file-lines doc-icon"></i>
                      <div className="doc-details">
                        <span className="doc-name">{doc.title}</span>
                        <div className="doc-meta-mobile">
                          <span className="doc-category-mobile">{doc.theme}</span>
                          <span className="doc-date-mobile">{formatDate(doc.date)}</span>
                        </div>
                        <span className="doc-meta">{doc.fileSize || '1.0 MB'} · {doc.downloadCount || 0} downloads</span>
                      </div>
                    </div>
                  </div>
                  <div className="col col-category">{doc.theme}</div>
                  <div className="col col-version">{doc.version}</div>
                  <div className="col col-date">{formatDate(doc.date)}</div>
                  <div className="col col-actions">
                    <button className="action-btn pdf-btn" onClick={() => handleDownload(doc)}>
                      <i className="fa-solid fa-download"></i>
                      PDF
                    </button>
                    <button className="action-btn view-btn" onClick={() => handleView(doc)}>
                      <i className="fa-solid fa-eye"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
};

export default DocumentsPage;