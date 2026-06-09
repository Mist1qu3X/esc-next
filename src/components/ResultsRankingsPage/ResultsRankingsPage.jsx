'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './ResultsRankingsPage.css';

const ResultsRankingsPage = () => {
  const [activeTab, setActiveTab] = useState('results');
  const [events, setEvents] = useState([]);
  const [disciplineLevel, setDisciplineLevel] = useState(false);
  const [resultsLevel, setResultsLevel] = useState(false);
  const [rankingsDetailLevel, setRankingsDetailLevel] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState('10m Air Pistol');
  const [rankings, setRankings] = useState([]);
  const [resultDetails, setResultDetails] = useState([]);
  const [gender, setGender] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('JAN 2026');
  const [filterType, setFilterType] = useState('ALL TYPES');
  const [filterStatus, setFilterStatus] = useState('ALL STATUSES');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, rankingsRes, resultsRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/events?populate=*&sort=date:asc&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/ranking-details?populate=*&sort=position:asc&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/result-details?populate=*&sort=position:asc&pagination[limit]=50`),
        ]);
        if (eventsRes.data?.data) setEvents(eventsRes.data.data);
        if (rankingsRes.data?.data) setRankings(rankingsRes.data.data);
        if (resultsRes.data?.data) setResultDetails(resultsRes.data.data);
      } catch (e) { console.error('Ошибка загрузки:', e); }
    };
    fetchData();
  }, []);

  const tabs = ['results', 'ranking', 'records'];
  const months = ['JAN 2026', 'FEB 2026', 'MAR 2026', 'APR 2026', 'MAY 2026', 'JUN 2026', 'JUL 2026', 'AUG 2026', 'SEP 2026', 'OCT 2026', 'NOV 2026', 'DEC 2026'];
  const types = ['ALL TYPES', 'CHAMPIONSHIP', 'EDUCATION', 'WORKSHOP'];
  const statuses = ['ALL STATUSES', 'UPCOMING', 'COMPLETED'];

  const disciplines = [
    { main: '10M', sub: 'AIR PISTOL', id: '10m-air-pistol', icon: '/img/icon1.png' },
    { main: '10M', sub: 'AIR RIFLE', id: '10m-air-rifle', icon: '/img/icon2.png' },
    { main: '25M', sub: 'PISTOL', id: '25m-pistol', icon: '/img/icon1.png' },
    { main: '50M', sub: 'RIFLE', id: '50m-rifle', icon: '/img/icon2.png' },
    { main: 'MOVING', sub: 'TARGET', id: 'moving-target', icon: '/img/icon3.png' },
    { main: 'SHOTGUN', sub: '', id: 'shotgun', icon: '/img/icon4.png' },
  ];

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
    return img.url?.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setDisciplineLevel(false);
    setResultsLevel(false);
    setRankingsDetailLevel(false);
  };

    const filteredResults = resultDetails.filter(r => {
        const matchDiscipline = r.discipline?.toLowerCase() === selectedDiscipline.toLowerCase();
        const matchGender = gender === 'ALL' || r.category === gender;
        return matchDiscipline && matchGender;
    });

  const filteredRankings = rankings.filter(r => {
    const matchGender = gender === 'ALL' || r.category === gender;
    return matchGender;
  });

  const filteredEvents = events.filter(ev => {
    const matchType = filterType === 'ALL TYPES' || ev.type === filterType;
    const matchStatus = filterStatus === 'ALL STATUSES' || 
      (filterStatus === 'UPCOMING' && ev.statusEvent === 'UPCOMING') ||
      (filterStatus === 'COMPLETED' && ev.statusEvent === 'FINISHED');
    return matchType && matchStatus;
  });

  const getShotClass = (val) => {
    if (val === '-' || val === '•' || !val) return 'shot-miss';
    const num = parseFloat(val);
    if (num >= 10.8) return 'shot-high';
    if (num >= 10.3) return 'shot-mid';
    return 'shot-low';
  };

  return (
    <>
      {/* HERO */}
      <section className="results-hero">
        <div className="results-breadcrumbs"><span className="breadcrumb-home">HOME</span><span className="breadcrumb-separator">›</span><span className="breadcrumb-active">RESULTS & RANKINGS</span></div>
        <div className="results-subtitle-row"><span className="results-line"></span><span className="results-subtitle">SPORTS DATA HUB</span></div>
        <h1 className="results-title">RESULTS & RANKINGS</h1>
        <div className="results-divider"></div>
        <div className="results-filters">
        {tabs.map((t) => <button key={t} className={`filter-btn ${activeTab === t ? 'active' : ''}`} onClick={() => switchTab(t)}>{t.toUpperCase()}</button>)}
        </div>
      </section>

      {/* RESULTS TAB - Level 1 */}
      {activeTab === 'results' && !disciplineLevel && !resultsLevel && (
        <section className="results-events">
          <div className="events-filter-bar">
            <div className="events-filter-left">
              <select className="events-select events-select-sm" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                {months.map((m) => <option key={m}>{m}</option>)}
              </select>
              <select className="events-select events-select-md" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                {types.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select className="events-select events-select-md" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="events-filter-right"><span className="events-count-num">{filteredEvents.length}</span><span className="events-count-label">competitions</span></div>
          </div>
          <div className="events-list">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className={`event-card ${ev.statusEvent === 'UPCOMING' ? 'event-upcoming' : 'event-completed'}`} onClick={() => setDisciplineLevel(true)}>
                <div className="event-card-left">
                  <div className="event-tags">
                    <span className={`event-status ${ev.statusEvent === 'UPCOMING' ? 'status-upcoming' : 'status-completed'}`}>{ev.statusEvent}</span>
                    <span className="event-category">{ev.category || 'SENIOR'}</span>
                    <span className="event-year">{new Date(ev.date).getFullYear()}</span>
                  </div>
                  <h3 className="event-card-title">{ev.name}</h3>
                  <div className="event-card-meta">
                    <span className="event-meta-item"><i className="fa-solid fa-location-dot"></i>{ev.location}</span>
                    <span className="event-meta-item"><i className="fa-regular fa-calendar"></i>{formatDate(ev.date)}</span>
                  </div>
                </div>
                <div className="event-card-right"><button className="event-view-btn">VIEW &gt;</button></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DISCIPLINE LEVEL - Level 2 */}
      {activeTab === 'results' && disciplineLevel && !resultsLevel && (
        <section className="discipline-level">
          <div className="discipline-filter-bar">
            <div className="discipline-filter-left">
              <select className="events-select events-select-sm"><option>JAN 2026</option></select>
              <select className="events-select events-select-md"><option>ALL TYPES</option></select>
              <select className="events-select events-select-md"><option>ALL STATUSES</option></select>
            </div>
            <div className="discipline-filter-right"><button className="export-btn"><i className="fa-solid fa-download"></i>EXPORT PDF</button></div>
          </div>
          <div className="discipline-breadcrumbs"><span className="disc-breadcrumb-parent" onClick={() => setDisciplineLevel(false)}>Results</span><span className="disc-breadcrumb-separator">›</span><span className="disc-breadcrumb-active">Competitions</span></div>
          <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC SEASON RANKING</span></div>
          <h2 className="discipline-title">SELECT A DISCIPLINE</h2>
          <p className="discipline-desc">Choose a discipline to view season rankings</p>
          <div className="discipline-grid">
            {disciplines.map((d) => (
              <div key={d.id} className="discipline-card" onClick={() => { setResultsLevel(true); setSelectedDiscipline(`${d.main} ${d.sub}`.trim()); }}>
                <h3 className="disc-card-title"><span className="disc-main">{d.main}</span><span className="disc-sub">{d.sub}</span></h3>
                <div className="disc-card-icon"><img src={d.icon} alt="" /><span className="disc-card-arrow">›</span></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RESULTS DETAIL - Level 3 */}
        {activeTab === 'results' && resultsLevel && (
        <section className="results-detail">
            <div className="results-detail-header"><span className="results-detail-line"></span><span className="results-detail-subtitle">ESC RESULTS</span></div>
            <h2 className="results-detail-title">{selectedDiscipline.toUpperCase()}</h2>
            <div className="results-detail-topbar">
            <div className="results-detail-breadcrumbs">
                <span className="rd-breadcrumb" onClick={() => { setResultsLevel(false); }}>Results</span>
                <span className="rd-breadcrumb-sep">›</span>
                <span className="rd-breadcrumb" onClick={() => setResultsLevel(false)}>Competitions</span>
                <span className="rd-breadcrumb-sep">›</span>
                <span className="rd-breadcrumb-active">{selectedDiscipline}</span>
            </div>
            <div className="results-detail-gender">
                {['ALL', 'MEN', 'WOMEN'].map((g) => (
                <button key={g} className={`gender-btn ${gender === g ? 'active' : ''}`} onClick={() => setGender(g)}>{g}</button>
                ))}
            </div>
            </div>
            <div className="results-table-container">
            <div className="results-table-header">
                <div className="rt-col rt-rank">RANK</div>
                <div className="rt-col rt-athlete">ATHLETE</div>
                <div className="rt-col rt-spacer"></div>
                <div className="rt-col rt-fed">FED</div>
                <div className="rt-col rt-series">SERIES (SHOT BY SHOT)</div>
                <div className="rt-col rt-total">TOTAL</div>
                <div className="rt-col rt-inner">INNER<br />10S</div>
            </div>
            {filteredResults.map((r, i) => {
                const medals = ['medal-gold', 'medal-silver', 'medal-bronze'];
                const medalClass = i < 3 ? `medal-row ${medals[i]}` : '';
                const shots = Array.isArray(r.shots) ? r.shots : [];
                return (
                <div key={r.id} className={`results-table-row ${medalClass}`}>
                    <div className="rt-col rt-rank">
                    {i < 3 ? <img src={`/img/medal${i+1}.png`} className="rank-medal" alt="" /> : <span className="rank-num">{r.position}</span>}
                    </div>
                    <div className="rt-col rt-athlete"><span className="athlete-name">{r.athleteName}</span></div>
                    <div className="rt-col rt-spacer"></div>
                    <div className="rt-col rt-fed">
                    {r.flag && <img src={getImageUrl(r.flag)} className="fed-flag-img" alt="" />}
                    <span>{r.federationCode}</span>
                    </div>
                    <div className="rt-col rt-series">
                    <div className="shots-container">
                        <div className="shots-row">{shots.slice(0, 12).map((s, si) => <span key={si} className={`shot ${getShotClass(s)}`}>{s}</span>)}</div>
                        <div className="shots-row">{shots.slice(12, 24).map((s, si) => <span key={si} className={`shot ${getShotClass(s)}`}>{s || '•'}</span>)}</div>
                    </div>
                    </div>
                    <div className="rt-col rt-total"><span className={`total-value ${i === 0 ? 'gold-value' : ''}`}>{r.total}</span></div>
                    <div className="rt-col rt-inner"><span className={`inner-value ${i === 0 ? 'gold-value' : ''}`}>{r.inner10s}</span></div>
                </div>
                );
            })}
            </div>
            <div className="results-pagination">
            {[1, 2, 3].map((p) => <button key={p} className={`page-btn ${p === 1 ? 'active' : ''}`}>{p}</button>)}
            <button className="page-btn next">NEXT &gt;</button>
            </div>
        </section>
        )}

      {/* RANKING TAB */}
      {activeTab === 'ranking' && !rankingsDetailLevel && (
        <section className="rankings-level">
          <div className="rankings-filter-bar">
            <div className="rankings-filter-left">
              <div className="rankings-search"><i className="fa-solid fa-magnifying-glass rankings-search-icon"></i><input type="text" className="rankings-search-input" placeholder="Search athlete or event..." /></div>
              <select className="events-select" style={{ width: 195 }}><option>ALL DISCIPLINES</option></select>
              <select className="events-select" style={{ width: 113 }}><option>ALL GENDER</option></select>
              <select className="events-select" style={{ width: 79 }}><option>2026</option></select>
            </div>
            <button className="export-btn"><i className="fa-solid fa-download"></i>EXPORT PDF</button>
          </div>
          <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC SEASON RANKINGS</span></div>
          <h2 className="discipline-title">SELECT A DISCIPLINE</h2>
          <p className="discipline-desc">Choose a discipline to view season rankings</p>
          <div className="discipline-grid">
            {disciplines.map((d) => (
              <div key={d.id} className="discipline-card" onClick={() => { setRankingsDetailLevel(true); setSelectedDiscipline(`${d.main} ${d.sub}`.trim()); }}>
                <h3 className="disc-card-title"><span className="disc-main">{d.main}</span><span className="disc-sub">{d.sub}</span></h3>
                <div className="disc-card-icon"><img src={d.icon} alt="" /><span className="disc-card-arrow">›</span></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RANKINGS DETAIL */}
        {activeTab === 'ranking' && rankingsDetailLevel && (
        <section className="rankings-detail">
            <div className="rankings-detail-breadcrumbs">
            <span className="rd-breadcrumb" onClick={() => setRankingsDetailLevel(false)}>Rankings</span>
            <span className="rd-breadcrumb-sep">›</span><span className="rd-breadcrumb-active">{selectedDiscipline}</span>
            </div>
            <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC SEASON RANKING</span></div>
            <div className="rankings-detail-topbar">
            <h2 className="rankings-detail-title">{selectedDiscipline.toUpperCase()}</h2>
            <div className="results-detail-gender">
                {['ALL', 'MEN', 'WOMEN'].map((g) => <button key={g} className={`gender-btn ${gender === g ? 'active' : ''}`} onClick={() => setGender(g)}>{g}</button>)}
            </div>
            </div>
            <div className="rankings-table-container">
            <div className="rankings-table-header">
                <div className="rt-col rt-rank">RANK</div><div className="rt-col rt-athlete">ATHLETE</div><div className="rt-col rt-spacer-wide"></div>
                <div className="rt-col rt-fed">FEDERATION</div><div className="rt-col rt-points">POINTS</div><div className="rt-col rt-events">EVENTS</div><div className="rt-col rt-best">BEST</div>
            </div>
            {filteredRankings.map((r, i) => {
                const medals = ['medal-row medal-gold', 'medal-row medal-silver', 'medal-row medal-bronze'];
                const medalClass = i < 3 ? medals[i] : '';
                const maxPoints = parseFloat(String(filteredRankings[0]?.points).replace(',', '')) || 1;
                const barWidth = (parseFloat(String(r.points).replace(',', '')) / maxPoints) * 100;
                return (
                <div key={r.id} className={`rankings-table-row ${medalClass}`}>
                    <div className="rt-col rt-rank">{i < 3 ? <img src={`/img/medal${i+1}.png`} className="rank-medal" alt="" /> : <span className="rank-num">{r.position}</span>}</div>
                    <div className="rt-col rt-athlete"><span className="athlete-name">{r.athleteName}</span></div>
                    <div className="rt-col rt-spacer-wide"></div>
                    <div className="rt-col rt-fed">
                    {r.flag && <img src={getImageUrl(r.flag)} className="fed-flag-img" alt="" />}
                    <span>{r.country}</span>
                    </div>
                    <div className="rt-col rt-points"><div className="points-block"><span className={`points-value ${i === 0 ? 'gold-value' : ''}`}>{r.points}</span><div className="points-bar"><div className="points-bar-fill" style={{ width: `${barWidth}%` }}></div></div></div></div>
                    <div className="rt-col rt-events"><span className="events-value">{r.events}</span></div>
                    <div className="rt-col rt-best"><span className={`best-value ${i === 0 ? 'gold-value' : ''}`}>{r.best}</span></div>
                </div>
                );
            })}
            </div>
            <div className="results-pagination">
            {[1, 2, 3].map((p) => <button key={p} className={`page-btn ${p === 1 ? 'active' : ''}`}>{p}</button>)}
            <button className="page-btn next">NEXT &gt;</button>
            </div>
        </section>
        )}

      {/* RECORDS */}
      {activeTab === 'records' && (
        <section className="content-section" style={{ display: 'block', padding: '40px 32px 80px', maxWidth: '1440px', margin: '0 auto', background: '#06101C' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '28px', color: '#fff', textTransform: 'uppercase' }}>RECORDS</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Records section coming soon</p>
        </section>
      )}
    </>
  );
};

export default ResultsRankingsPage;