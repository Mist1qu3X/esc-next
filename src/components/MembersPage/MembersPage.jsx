'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import { getFederationWebsite } from '@/lib/federationWebsites';
import { REGIONS } from '@/lib/regions';
import './MembersPage.css';

// Дефолтные статы (fallback, пока коллекция member-stats пуста)
const DEFAULT_STATS = [
  { number: '16+', label: 'ANNUAL EVENTS' },
  { number: '55+', label: 'YEARS' },
  { number: '58', label: 'MEMBER' },
  { number: '10000+', label: 'ATHLETES' },
];

const MembersPage = () => {
  const [federations, setFederations] = useState([]);
  const [filteredFeds, setFilteredFeds] = useState([]);
  const [stats, setStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);

  // Набор регионов — общий с DiscoverPage (src/lib/regions.js).

  useEffect(() => {
    const fetchFederations = async () => {
      try {
        const [res, statsRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/federations?populate=*&pagination[limit]=100`),
          axios.get(`${config.API_URL}/api/member-stats?sort=order:asc&pagination[limit]=20`).catch(() => ({ data: { data: [] } })),
        ]);
        if (res.data?.data) {
          setFederations(res.data.data);
          setFilteredFeds(res.data.data);
        }
        setStats(statsRes.data?.data || []);
        setLoading(false);
      } catch (e) {
        console.error('Ошибка загрузки федераций:', e);
        setLoading(false);
      }
    };
    fetchFederations();
  }, []);

  useEffect(() => {
    let result = [...federations];
    
    if (activeRegion !== 'ALL') {
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
      <section className="mp-hero">
        <div className="mp-breadcrumbs-row">
          <span className="mp-breadcrumb-home">HOME</span>
          <span className="mp-breadcrumb-separator">›</span>
          <span className="mp-breadcrumb-active">MEMBERS</span>
        </div>
        <div className="mp-next-layer">
          <span className="mp-breadcrumb-line"></span>
          <span className="mp-breadcrumb-subtitle">MEMBER DIRECTORY</span>
        </div>
        <div className="mp-header-row">
          <h1 className="mp-title">MEMBER FEDERATIONS</h1>
          <div className="mp-stats">
            {(stats.length > 0 ? stats : DEFAULT_STATS).map((s, i) => (
              <div className="mp-stat-item" key={s.id || i}>
                <span className="mp-stat-number">{s.number}</span>
                <span className="mp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mp-divider"></div>
        <div className="mp-controls">
          <div className="mp-search">
            <i className="fa-solid fa-magnifying-glass mp-search-icon"></i>
            <input
              type="text"
              className="mp-search-field"
              placeholder="Search federation or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mp-region-buttons">
            {REGIONS.map((r) => (
              <button
                key={r.value}
                className={`mp-region-btn ${activeRegion === r.value ? 'active' : ''}`}
                onClick={() => setActiveRegion(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="mp-view-buttons">
            <button
              className={`mp-view-btn-grid ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fa-solid fa-grid-2"></i> GRID
            </button>
            <button
              className={`mp-view-btn-list ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fa-solid fa-list"></i> LIST
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="mp-grid-section" style={{ paddingTop: 48 }}>
          <div className="mp-federations-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="mp-federation-card skeleton-card" key={i}>
                <div className="mp-card-top-row">
                  <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 8 }}></div>
                  <div className="skeleton" style={{ width: 30, height: 14, borderRadius: 3 }}></div>
                </div>
                <div className="mp-federation-info">
                  <div className="skeleton" style={{ width: '75%', height: 16, borderRadius: 3, marginTop: 4 }}></div>
                  <div className="skeleton" style={{ width: '45%', height: 12, borderRadius: 3, marginTop: 8 }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (<>
      {/* GRID VIEW */}
        {viewMode === 'grid' && (
          <section className="mp-grid-section">
            <div className="mp-showing-header">
              <span className="mp-showing-label">Showing</span>
              <span className="mp-showing-number">{filteredFeds.length}</span>
              <span className="mp-showing-text">FEDERATIONS</span>
            </div>
          <div className="mp-federations-grid">
            {loading ? (
              <p style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1' }}>
                Loading federations...
              </p>
            ) : (
              filteredFeds.map((fed) => (
                <div className="mp-federation-card" key={fed.id}>
                  <div className="mp-card-top-row">
                    <div className="mp-federation-initials">{fed.code || fed.countryCode || fed.name?.slice(0, 3).toUpperCase()}</div>
                    <span className="mp-federation-code">{fed.countryCode || fed.code}</span>
                  </div>
                  <div className="mp-federation-info">
                    <h3 className="mp-federation-name">{fed.country || fed.name}</h3>
                    <p className="mp-federation-country">{fed.name}</p>
                    <div className="mp-card-divider"></div>
                    <p className="mp-president-label">PRESIDENT</p>
                    <p className="mp-president-name">{fed.president || '—'}</p>
                    <div className="mp-contact-info">
                      <div className="mp-contact-item">
                        <i className="fa-regular fa-envelope"></i>
                        <span>{fed.email || '—'}</span>
                      </div>
                      <div className="mp-contact-item">
                        <i className="fa-solid fa-phone"></i>
                        <span>{fed.phone || '—'}</span>
                      </div>
                    </div>
                    <button className="mp-view-federation-btn" onClick={() => window.open(getFederationWebsite(fed), '_blank', 'noopener,noreferrer')}>VIEW FEDERATION ›</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <section className="mp-list-section">
          <div className="mp-showing-header">
            <span className="mp-showing-label">Showing</span>
            <span className="mp-showing-number">{filteredFeds.length}</span>
            <span className="mp-showing-text">FEDERATIONS</span>
          </div>
          <div className="mp-federations-list-wrapper">
            {loading ? (
              <p style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
                Loading federations...
              </p>
            ) : (
              <table className="mp-federations-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Federation</th>
                    <th>Country</th>
                    <th>President</th>
                    <th>Contact</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeds.map((fed) => (
                    <tr key={fed.id}>
                      <td className="mp-list-code">{fed.countryCode || fed.code}</td>
                      <td className="mp-list-name">{fed.name}</td>
                      <td className="mp-list-country">{fed.country || fed.name}</td>
                      <td className="mp-list-president">{fed.president || '—'}</td>
                      <td className="mp-list-contact">
                        {fed.email && <div><i className="fa-regular fa-envelope"></i> {fed.email}</div>}
                        {fed.phone && <div><i className="fa-solid fa-phone"></i> {fed.phone}</div>}
                      </td>
                      <td className="mp-list-actions">
                        <button className="mp-view-federation-btn" onClick={() => window.open(getFederationWebsite(fed), '_blank', 'noopener,noreferrer')}>VIEW ›</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
      </>)}
    </>
  );
};

export default MembersPage;