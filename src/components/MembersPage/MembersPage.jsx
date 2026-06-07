'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './MembersPage.css';

const MembersPage = () => {
  const [federations, setFederations] = useState([]);
  const [filteredFeds, setFilteredFeds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState('All Regions');
  const [viewMode, setViewMode] = useState('grid');

  const regions = ['All Regions', 'Western Europe', 'Central Europe', 'Northern Europe', 'Southern Europe', 'Eastern Europe'];

  useEffect(() => {
    const fetchFederations = async () => {
      try {
        const res = await axios.get(`${config.API_URL}/api/federations?populate=*&pagination[limit]=100`);
        if (res.data.data) {
          setFederations(res.data.data);
          setFilteredFeds(res.data.data);
        }
      } catch (e) { console.error('Ошибка загрузки федераций:', e); }
    };
    fetchFederations();
  }, []);

  useEffect(() => {
    let result = [...federations];
    if (activeRegion !== 'All Regions') {
      result = result.filter((f) => f.region === activeRegion);
    }
    if (searchTerm) {
      result = result.filter(
        (f) =>
          f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredFeds(result);
  }, [searchTerm, activeRegion, federations]);

  return (
    <>
      {/* ========== HERO ========== */}
      <section className="members-hero">
        <div className="breadcrumbs-row">
          <span className="breadcrumb-home">HOME</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">MEMBERS</span>
        </div>
        <div className="next-layer">
          <span className="breadcrumb-line"></span>
          <span className="breadcrumb-subtitle">MEMBER DIRECTORY</span>
        </div>
        <div className="members-header-row">
          <h1 className="members-title">MEMBER FEDERATIONS</h1>
          <div className="members-stats">
            <div className="stat-item">
              <span className="stat-number">{federations.length || 47}</span>
              <span className="stat-label">FULL MEMBERS</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">38</span>
              <span className="stat-label">NATIONS</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">12,400+</span>
              <span className="stat-label">ATHLETES</span>
            </div>
          </div>
        </div>
        <div className="members-divider"></div>
        <div className="members-controls">
          <div className="members-search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              className="members-search-field"
              placeholder="Search federation or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="region-buttons">
            {regions.map((r) => (
              <button
                key={r}
                className={`region-btn ${activeRegion === r ? 'active' : ''}`}
                onClick={() => setActiveRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="view-buttons">
            <button
              className={`view-btn-grid ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fa-solid fa-grid-2"></i> GRID
            </button>
            <button
              className={`view-btn-list ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fa-solid fa-list"></i> LIST
            </button>
          </div>
        </div>
      </section>

      {/* ========== GRID ========== */}
      <section className="members-grid-section">
        <div className="showing-header">
          <span className="showing-label">Showing</span>
          <span className="showing-number">{filteredFeds.length}</span>
          <span className="showing-text">FEDERATIONS</span>
        </div>
        <div className="federations-grid">
          {filteredFeds.map((fed) => (
            <div className="federation-card" key={fed.id}>
              <div className="card-top-row">
                <div className="federation-initials">{fed.code || fed.name?.slice(0, 3).toUpperCase()}</div>
                <span className="federation-code">{fed.code}</span>
              </div>
              <div className="federation-info">
                <h3 className="federation-name">{fed.name}</h3>
                <p className="federation-country">{fed.country || fed.name}</p>
                <div className="card-divider"></div>
                <p className="president-label">PRESIDENT</p>
                <p className="president-name">{fed.president || '—'}</p>
                <div className="contact-info">
                  <div className="contact-item">
                    <i className="fa-regular fa-envelope"></i>
                    <span>{fed.email || '—'}</span>
                  </div>
                  <div className="contact-item">
                    <i className="fa-solid fa-phone"></i>
                    <span>{fed.phone || '—'}</span>
                  </div>
                </div>
                <button className="view-federation-btn">VIEW FEDERATION ›</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default MembersPage;