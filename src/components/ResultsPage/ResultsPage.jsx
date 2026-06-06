'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './ResultsPage.css';
import './RecordsPage.css';

const ResultsPage = () => {
  const [activeTab, setActiveTab] = useState('results');
  const [results, setResults] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discipline, setDiscipline] = useState('All Disciplines');
  const [category, setCategory] = useState('All Categories');
  const [year, setYear] = useState('2026');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsRes, rankingsRes, recordsRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/results?populate=*&sort=rank:asc&pagination[limit]=50`),
          axios.get(`${config.API_URL}/api/rankings?populate=*&sort=position:asc&pagination[limit]=50`),
          axios.get(`${config.API_URL}/api/records?populate=*&sort=date:desc&pagination[limit]=50`),
        ]);
        if (resultsRes.data.data) setResults(resultsRes.data.data);
        if (rankingsRes.data.data) setRankings(rankingsRes.data.data);
        if (recordsRes.data.data) setRecords(recordsRes.data.data);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  const filterResults = () => results.filter((r) => {
    const matchSearch = !searchTerm || r.athleteName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDiscipline = discipline === 'All Disciplines' || r.discipline === discipline;
    const matchCategory = category === 'All Categories' || r.category === category;
    const matchYear = !year || new Date(r.eventDate).getFullYear().toString() === year;
    return matchSearch && matchDiscipline && matchCategory && matchYear;
  });

  const filterRankings = () => rankings.filter((r) => !searchTerm || r.athleteName?.toLowerCase().includes(searchTerm.toLowerCase()));

  const filterRecords = () => records.filter((r) => {
    const matchSearch = !searchTerm || r.athleteName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDiscipline = discipline === 'All Disciplines' || r.discipline === discipline;
    return matchSearch && matchDiscipline;
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const medal = (r) => r === 1 ? 'gold' : r === 2 ? 'silver' : r === 3 ? 'bronze' : null;

  return (
    <>
      <section className="results-hero">
        <div className="results-breadcrumbs">
          <span className="breadcrumb-home">HOME</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">RESULTS & RANKINGS</span>
        </div>
        <div className="results-subtitle-row">
          <span className="results-line"></span>
          <span className="results-subtitle">SPORTS DATA HUB</span>
        </div>
        <h1 className="results-title">RESULTS & RANKINGS</h1>
        <div className="results-divider"></div>
        <div className="results-filters">
          {['results', 'ranking', 'records'].map((t) => (
            <button 
              key={t} 
              className={`filter-btn ${activeTab === t ? 'active' : ''}`} 
              onClick={() => setActiveTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="results-search-bar">
        <div className="search-controls">
          <div className="results-search">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              className="results-search-input" 
              placeholder="Search athlete, event..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <select className="results-select" style={{ width: 195 }} value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
            <option>All Disciplines</option>
            <option>10m Air Rifle</option>
            <option>10m Air Pistol</option>
            <option>50m Rifle</option>
          </select>
          <select className="results-select" style={{ width: 113 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All Categories</option>
            <option>Men</option>
            <option>Women</option>
            <option>Youth</option>
          </select>
          <select className="results-select" style={{ width: 79 }} value={year} onChange={(e) => setYear(e.target.value)}>
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
            <option>2023</option>
          </select>
          <button className="export-btn">
            <i className="fa-solid fa-download"></i>
            EXPORT PDF
          </button>
        </div>
        <div className="results-divider"></div>
      </section>

      {/* RESULTS - проверьте, что здесь НЕТ колонки-спейсера */}
    {activeTab === 'results' && (
    <section className="final-results content-section active">
        <div className="results-header">
        <div className="results-event-info">
            <div className="event-details-row">
            <span>{discipline !== 'All Disciplines' ? discipline.toUpperCase() : '10M AIR RIFLE WOMEN'}</span>
            <span className="event-dot">·</span>
            <span>{filterResults().length} RESULTS</span>
            </div>
            <h2 className="final-results-title">FINAL RESULTS</h2>
        </div>
        </div>
        <div className="results-divider"></div>
        <div className="results-table-wrapper">
        {/* ВАЖНО: здесь 7 колонок, НЕТ колонки col-spacer */}
        <div className="results-table-header">
            <div className="col col-rank">RANK</div>
            <div className="col col-athlete">ATHLETE</div>
            <div className="col col-federation">FEDERATION</div>
            <div className="col col-final">FINAL</div>
            <div className="col col-qual">QUAL.</div>
            <div className="col col-event">EVENT</div>
            <div className="col col-date">DATE</div>
        </div>
        
        {filterResults().map((r) => {
            const m = medal(r.rank);
            const flagUrl = r.flag?.url?.startsWith('http') ? r.flag.url : `${config.API_URL}${r.flag?.url || ''}`;
            return (
            // ВАЖНО: здесь тоже 7 колонок, НЕТ колонки col-spacer
            <div className="results-table-row" key={r.id}>
                <div className="col col-rank">
                {m ? <span className={`rank-badge ${m}`}>{r.rank}</span> : <span className="rank-number">{r.rank}</span>}
                </div>
                <div className="col col-athlete">
                <span className="athlete-name">{r.athleteName}</span>
                </div>
                <div className="col col-federation">
                {flagUrl && <img src={flagUrl} alt={r.federationCode} className="flag-icon" />}
                <span>{r.federationCode || r.federation}</span>
                </div>
                <div className={`col col-final ${r.rank === 1 ? 'first-place-final' : ''}`}>
                {r.finalScore}
                </div>
                <div className="col col-qual">{r.qualScore}</div>
                <div className="col col-event">{r.eventName}</div>
                <div className="col col-date">{formatDate(r.eventDate)}</div>
            </div>
            );
        })}
        </div>
    </section>
    )}

      {/* RANKING - исправлено: 6 колонок без спейсера */}
      {activeTab === 'ranking' && (
        <section className="final-results content-section active">
          <div className="results-header">
            <div className="results-event-info">
              <div className="event-details-row">
                <span>10M AIR RIFLE WOMEN</span>
                <span className="event-dot">·</span>
                <span>SEASON 2026</span>
              </div>
              <h2 className="final-results-title">ESC SEASON RANKINGS</h2>
            </div>
          </div>
          <div className="results-divider"></div>
          <div className="results-table-wrapper">
            {/* Header: 6 колонок для рейтинга */}
            <div className="results-table-header rankings-header">
              <div className="col col-rank">RANK</div>
              <div className="col col-athlete">ATHLETE</div>
              <div className="col col-federation">FEDERATION</div>
              <div className="col col-points">POINTS</div>
              <div className="col col-events">EVENTS</div>
              <div className="col col-best">BEST</div>
            </div>
            
            {filterRankings().map((r) => {
              const m = medal(r.position);
              return (
                <div className="results-table-row rankings-row" key={r.id}>
                  <div className="col col-rank">
                    {m ? <span className={`rank-badge ${m}`}>{r.position}</span> : <span className="rank-number">{r.position}</span>}
                  </div>
                  <div className="col col-athlete">
                    <span className="athlete-name">{r.athleteName}</span>
                  </div>
                  <div className="col col-federation">{r.country}</div>
                  <div className="col col-points">
                    <span className={`points-value ${r.position === 1 ? 'first-place-points' : ''}`}>{r.points}</span>
                    <div className="points-line"></div>
                  </div>
                  <div className="col col-events">{r.events}</div>
                  <div className="col col-best">{r.best}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* RECORDS */}
      {activeTab === 'records' && (
        <section className="final-results content-section active">
          <div className="results-header">
            <div className="results-event-info">
              <h2 className="final-results-title">RECORDS</h2>
              <p className="records-subtitle">World and European records across ESC disciplines</p>
            </div>
          </div>
          <div className="results-divider"></div>
          <div className="records-cards">
            {filterRecords().map((r) => (
              <div className="record-card" key={r.id}>
                <div className="record-col col-discipline">
                  <span className="record-discipline">{r.discipline}</span>
                </div>
                <div className="record-col col-badge">
                  <span className={`record-badge ${r.type?.toLowerCase()}`}>
                    {r.type?.toUpperCase()} RECORD
                  </span>
                </div>
                <div className="record-col col-score">
                  <span className={`record-score ${r.type?.toLowerCase()}`}>{r.score}</span>
                </div>
                <div className="record-col col-spacer"></div>
                <div className="record-col col-athlete-info">
                  <span className="record-athlete">{r.athleteName}</span>
                </div>
                <div className="record-col col-location">
                  <span className="record-flag">{r.countryFlag}</span>
                  <span className="record-country">{r.country}</span>
                  <span className="record-sep">·</span>
                  <span className="record-event">{r.eventName}</span>
                </div>
                <div className="record-col col-date">
                  <span className="record-date">{formatDate(r.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default ResultsPage;