'use client';
import { useState, useEffect } from 'react';
import { cachedGet } from '@/lib/apiCache';
import config from '@/lib/config';
import { getFederationWebsite } from '@/lib/federationWebsites';
import { REGIONS } from '@/lib/regions';
import Pagination from '@/components/Pagination/Pagination';
import './MembersPage.css';

const PER_PAGE = 28; // 7 рядов × 4 карточки, как в макете

// Fallback-значения, если member-stats недоступна (напр. нет Public-прав на чтение).
// Реальные цифры берутся из коллекции member-stats в Strapi.
const DEFAULT_STATS = [
  { number: '16+', label: 'ANNUAL EVENTS' },
  { number: '55+', label: 'YEARS' },
  { number: '60', label: 'MEMBER' },
  { number: '10000+', label: 'ATHLETES' },
];

// Читаемая подпись региона для карточки (value поля region → label кнопки фильтра)
const REGION_LABELS = REGIONS.reduce((acc, r) => { acc[r.value] = r.label; return acc; }, {});
const regionLabel = (region) => {
  if (!region) return null;
  if (REGION_LABELS[region]) return REGION_LABELS[region];
  // незнакомые значения (например, Кавказ) — аккуратно капитализируем
  return region.replace(/[._]/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const MembersPage = () => {
  const [federations, setFederations] = useState([]);
  const [filteredFeds, setFilteredFeds] = useState([]);
  const [stats, setStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Набор регионов — общий с DiscoverPage (src/lib/regions.js).

  useEffect(() => {
    const fetchFederations = async () => {
      try {
        const [res, statsRes] = await Promise.all([
          cachedGet(`${config.API_URL}/api/federations?populate=*&pagination[limit]=100`),
          cachedGet(`${config.API_URL}/api/member-stats?sort=order:asc&pagination[limit]=20`).catch(() => ({ data: { data: [] } })),
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
    setCurrentPage(1); // при смене фильтра — на первую страницу
  }, [searchTerm, activeRegion, federations]);

  // Стата целиком из Strapi (коллекция member-stats). Если недоступна/пуста —
  // показываем заглушки DEFAULT_STATS. Значения меняются в админке Strapi.
  const displayStats = stats.length > 0 ? stats : DEFAULT_STATS;

  const totalPages = Math.max(1, Math.ceil(filteredFeds.length / PER_PAGE));
  const pageFeds = filteredFeds.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const hasFilters = activeRegion !== 'ALL' || !!searchTerm;
  const emptyState = (
    <div className="mp-empty-state">
      <i className="fa-regular fa-compass mp-empty-icon"></i>
      <p className="mp-empty-title">No federations found</p>
      <p className="mp-empty-text">
        {hasFilters ? (
          <>
            Nothing matches{' '}
            {activeRegion !== 'ALL' && <b>{regionLabel(activeRegion)}</b>}
            {activeRegion !== 'ALL' && searchTerm && ' · '}
            {searchTerm && <>“<b>{searchTerm}</b>”</>}. Try a different region or search.
          </>
        ) : (
          'No member federations to display yet.'
        )}
      </p>
      {hasFilters && (
        <button className="mp-empty-btn" onClick={() => { setActiveRegion('ALL'); setSearchTerm(''); }}>
          Clear filters
        </button>
      )}
    </div>
  );

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
            {displayStats.map((s, i) => (
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
          <div className={`mp-federations-grid ${filteredFeds.length === 0 ? 'mp-grid-empty' : ''}`}>
            {filteredFeds.length > 0 ? (
              pageFeds.map((fed) => (
                <div className="mp-federation-card" key={fed.id}
                  onClick={() => window.open(getFederationWebsite(fed), '_blank', 'noopener,noreferrer')}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.open(getFederationWebsite(fed), '_blank', 'noopener,noreferrer'); } }}>
                  <div className="mp-card-top-row">
                    <div className="mp-federation-initials">{fed.code || fed.countryCode || fed.name?.slice(0, 3).toUpperCase()}</div>
                    <span className="mp-federation-code">{fed.countryCode || fed.code}</span>
                  </div>
                  <div className="mp-federation-info">
                    <h3 className="mp-federation-name" title={fed.country || fed.name}>{fed.country || fed.name}</h3>
                    <p className="mp-federation-country" title={fed.name}>{fed.name}</p>
                    {regionLabel(fed.region) && (
                      <span className="mp-federation-region"><i className="fa-solid fa-location-dot"></i>{regionLabel(fed.region)}</span>
                    )}
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
                    <button className="mp-view-federation-btn" onClick={(e) => { e.stopPropagation(); window.open(getFederationWebsite(fed), '_blank', 'noopener,noreferrer'); }}>VIEW FEDERATION ›</button>
                  </div>
                </div>
              ))
            ) : emptyState}
          </div>
          <Pagination page={currentPage} pageCount={totalPages} onChange={setCurrentPage} />
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
            {filteredFeds.length > 0 ? (
              <table className="mp-federations-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Federation</th>
                    <th>Country</th>
                    <th>Region</th>
                    <th>President</th>
                    <th>Contact</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageFeds.map((fed) => (
                    <tr key={fed.id}>
                      <td className="mp-list-code">{fed.countryCode || fed.code}</td>
                      <td className="mp-list-name">{fed.name}</td>
                      <td className="mp-list-country">{fed.country || fed.name}</td>
                      <td className="mp-list-region">{regionLabel(fed.region) || '—'}</td>
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
            ) : emptyState}
          </div>
          <Pagination page={currentPage} pageCount={totalPages} onChange={setCurrentPage} />
        </section>
      )}
      </>)}
    </>
  );
};

export default MembersPage;