'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './DiscoverPage.css';

const DiscoverPage = () => {
  const [pageData, setPageData] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [federations, setFederations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [governance, setGovernance] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [openPanels, setOpenPanels] = useState({});
  const [filterRegion, setFilterRegion] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutRes, leadersRes, fedsRes, milestonesRes, govRes, membersRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/about-pages?populate=*`),
          axios.get(`${config.API_URL}/api/leaders?populate=*&sort=order:asc`),
          axios.get(`${config.API_URL}/api/federations?populate=*&pagination[limit]=100`),
          axios.get(`${config.API_URL}/api/heritage-milestones?sort=order:asc`),
          axios.get(`${config.API_URL}/api/governances?sort=order:asc&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/committee-members?populate=*&pagination[limit]=50`),
        ]);

        setPageData(
          Array.isArray(aboutRes.data?.data)
            ? aboutRes.data.data[0]
            : aboutRes.data?.data || null
        );
        setLeaders(leadersRes.data?.data || []);
        setFederations(fedsRes.data?.data || []);
        setMilestones(milestonesRes.data?.data || []);
        setGovernance(govRes.data?.data || []);
        setCommitteeMembers(membersRes.data?.data || []);
      } catch (e) {
        console.error('Ошибка загрузки Discover:', e);
      }
    };
    fetchData();
  }, []);

  const togglePanel = (id) => setOpenPanels(prev => ({ ...prev, [id]: !prev[id] }));

  const regions = ['ALL', 'W.EUROPE', 'SCANDINAVIA', 'C.EUROPE', 'E.EUROPE', 'S.EUROPE', 'CAUCASUS'];
  const filteredFeds = filterRegion === 'ALL'
    ? federations
    : federations.filter(f => f.region === filterRegion);

  const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
    return img.url?.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
  };

  const assembly = governance.find(g => g.type === 'legislative');
  const executive = governance.find(g => g.type === 'executive');
  
  // ПОЛУЧАЕМ УНИКАЛЬНЫЕ КОМИТЕТЫ ИЗ committee-members
  const committees = [...new Map(
    committeeMembers
      .filter(m => m.committee) // только те, у кого есть committee
      .map(m => [m.committee, {
        id: m.committee.replace(/\s/g, '_'), // создаем ID из названия
        name: m.committee,
        members: `${committeeMembers.filter(cm => cm.committee === m.committee).length} members`,
        description: `${m.committee} committee description` // описание можно добавить в Strapi
      }])
  ).values()];

  const getCommitteeMembers = (committeeName) => {
    return committeeMembers.filter(m => m.committee === committeeName);
  };

  return (
    <>
      {/* ========== ABOUT HERO ========== */}
      <section className="about-hero">
        <div className="breadcrumbs-row">
          <span className="breadcrumb-home">HOME</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-active">DISCOVER</span>
        </div>
        <div className="next-layer">
          <span className="breadcrumb-line"></span>
          <span className="breadcrumb-subtitle">{pageData?.heroSubtitle}</span>
        </div>
        <div className="about-title-row">
          <h1>{pageData?.heroTitle1}</h1>
          <h1 className="accent">{pageData?.heroTitle2}</h1>
        </div>
      </section>

      {/* ========== WHO WE ARE ========== */}
      <section className="who-we-are">
        <div className="who-we-are-container">
          <div className="who-left">
            <div className="who-next-layer">
              <span className="who-line"></span>
              <span className="who-subtitle">WHO WE ARE</span>
            </div>
            <h2 className="who-title">{pageData?.missionTitle}</h2>
            <p className="who-text">{pageData?.missionText1}</p>
            <p className="who-text">{pageData?.missionText2}</p>
            <div className="who-stats">
              <div className="stat-card"><span className="stat-number">{pageData?.statsMembers}</span><span className="stat-label">{pageData?.statsLabelMembers}</span></div>
              <div className="stat-card"><span className="stat-number">{pageData?.statsNations}</span><span className="stat-label">{pageData?.statsLabelNations}</span></div>
              <div className="stat-card"><span className="stat-number">{pageData?.statsEvents}</span><span className="stat-label">{pageData?.statsLabelEvents}</span></div>
              <div className="stat-card"><span className="stat-number">{pageData?.statsYears}</span><span className="stat-label">{pageData?.statsLabelYears}</span></div>
            </div>
          </div>
          <div className="who-right">
            {pageData?.missionImage && (
              <img src={getImageUrl(pageData.missionImage)} alt="ESC" />
            )}
          </div>
        </div>
      </section>

      {/* ========== CORE VALUES ========== */}
      <section className="core-values">
        <div className="core-next-layer">
          <span className="core-line"></span>
          <span className="core-subtitle">CORE VALUES</span>
        </div>
        <div className="core-cards">
          <div className="core-card">
            <div className="core-icon-box">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="#00d8f5" strokeWidth="1.5"/>
                <circle cx="11" cy="11" r="6" stroke="#00d8f5" strokeWidth="1.5"/>
                <circle cx="11" cy="11" r="2" fill="#00d8f5"/>
              </svg>
            </div>
            <h3 className="core-card-title">EXCELLENCE</h3>
            <p className="core-card-text">We set and uphold the highest standards of athletic competition, officiating, and event quality across Europe.</p>
          </div>
          <div className="core-card">
            <div className="core-icon-box">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 1L3 5V11C3 15.5 6.5 19.5 11 21C15.5 19.5 19 15.5 19 11V5L11 1Z" stroke="#00d8f5" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="core-card-title">INTEGRITY</h3>
            <p className="core-card-text">Fair play, anti-doping compliance, and transparent governance are non-negotiable pillars of our federation.</p>
          </div>
          <div className="core-card">
            <div className="core-icon-box">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9.5" stroke="#00d8f5" strokeWidth="1.5"/>
                <ellipse cx="11" cy="11" rx="4.5" ry="9.5" stroke="#00d8f5" strokeWidth="1.5"/>
                <line x1="2" y1="11" x2="20" y2="11" stroke="#00d8f5" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="core-card-title">INCLUSION</h3>
            <p className="core-card-text">We support the development of the sport in every member nation, from established powers to emerging federations.</p>
          </div>
        </div>
      </section>

      {/* ========== STRUCTURE / GOVERNANCE ========== */}
      <section className="structure">
        <div className="structure-next-layer">
          <span className="structure-line"></span>
          <span className="structure-subtitle">STRUCTURE</span>
        </div>
        <h2 className="structure-title">GOVERNANCE</h2>

        {/* General Assembly */}
        {assembly && (
          <>
            <div className={`structure-block block-main ${openPanels['assembly'] ? 'has-open-panel' : ''}`}>
              <div className="block-label">LEGISLATIVE</div>
              <div className="block-info">
                <h3 className="block-name">{assembly.name}</h3>
                <p className="block-desc">{assembly.members}</p>
              </div>
              <button className="block-toggle" onClick={() => togglePanel('assembly')}>
                {openPanels['assembly'] ? 'CLOSE' : 'VIEW'} <i className={`fa-solid fa-chevron-${openPanels['assembly'] ? 'up' : 'down'}`}></i>
              </button>
            </div>
            {openPanels['assembly'] && (
              <div className="assembly-panel is-open">
                <div className="assembly-header">
                  <div className="assembly-label">LEGISLATIVE</div>
                  <h3 className="assembly-title">{assembly.name}</h3>
                  <p className="assembly-description">{assembly.description}</p>
                  <button className="panel-close" onClick={() => togglePanel('assembly')}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="assembly-federations">
                  {federations.slice(0, 46).map((fed) => (
                    <div className="assembly-member" key={fed.id}>
                      <div className={`assembly-flag flag-${fed.countryCode?.toLowerCase() || 'de'}`}></div>
                      <div className="assembly-code">{fed.code}</div>
                      <div className="assembly-country">{fed.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Executive Committee */}
        {executive && (
          <>
            <div className={`structure-block block-accent ${openPanels['executive'] ? 'has-open-panel' : ''}`}>
              <div className="block-label">EXECUTIVE</div>
              <div className="block-info">
                <h3 className="block-name">{executive.name}</h3>
                <p className="block-desc">{executive.members}</p>
              </div>
              <button className="block-toggle" onClick={() => togglePanel('executive')}>
                {openPanels['executive'] ? 'CLOSE' : 'VIEW'} <i className={`fa-solid fa-chevron-${openPanels['executive'] ? 'up' : 'down'}`}></i>
              </button>
            </div>
            {openPanels['executive'] && (
              <div className="assembly-panel is-open">
                <div className="assembly-header">
                  <div className="assembly-label">EXECUTIVE</div>
                  <h3 className="assembly-title">{executive.name}</h3>
                  <p className="assembly-description">{executive.description}</p>
                  <button className="panel-close" onClick={() => togglePanel('executive')}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="executive-members">
                  {leaders.slice(0, 9).map((l) => (
                    <div className="executive-member" key={l.id}>
                      <div className="executive-photo"><span>{l.initials}</span></div>
                      <div className="executive-info">
                        <h4>{l.name}</h4>
                        <span className="executive-role">{l.role}</span>
                        <div className="executive-country">
                          <span className={`assembly-flag flag-${l.countryCode?.toLowerCase() || 'de'}`}></span>
                          {l.country}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* КОМИТЕТЫ - теперь из committee-members */}
        {committees.length > 0 && (
          <div className="committee-cards">
            {committees.map((c) => (
              <div key={c.id} className="committee-card" onClick={() => togglePanel(c.id)}>
                <div className="committee-card-content">
                  <h4 className="committee-name">{c.name}</h4>
                  <p className="committee-members">{c.members}</p>
                </div>
                <i className={`fa-solid fa-chevron-${openPanels[c.id] ? 'up' : 'down'} committee-arrow`}></i>
              </div>
            ))}
          </div>
        )}

        {/* Панели комитетов */}
        {committees.map((c) => {
          const members = getCommitteeMembers(c.name);
          return (
            openPanels[c.id] && (
              <div key={`panel-${c.id}`} className="assembly-panel is-open">
                <div className="assembly-header">
                  <div className="assembly-label">COMMITTEE</div>
                  <h3 className="assembly-title">{c.name}</h3>
                  <p className="assembly-description">{c.description}</p>
                  <button className="panel-close" onClick={() => togglePanel(c.id)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                {members.length > 0 && (
                  <div className="executive-members">
                    {members.map((m) => (
                      <div className="executive-member" key={m.id}>
                        <div className="executive-photo"><span>{m.initials}</span></div>
                        <div className="executive-info">
                          <h4>{m.name}</h4>
                          <span className="executive-role">{m.role}</span>
                          <div className="executive-country">
                            <span className={`assembly-flag flag-${m.countryCode?.toLowerCase() || 'de'}`}></span>
                            {m.country}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          );
        })}
      </section>

      {/* ========== LEADERSHIP ========== */}
      <section className="leadership">
        <div className="leadership-header">
          <div className="leadership-naming">
            <span className="leadership-line"></span>
            <span className="leadership-title">LEADERSHIP</span>
          </div>
          <a href="#" className="leadership-directory">FULL DIRECTORY <i className="fa-solid fa-arrow-right"></i></a>
        </div>
        <div className="leadership-cards">
          {leaders.slice(0, 4).map((l) => (
            <div className="leader-card" key={l.id}>
              <div className="leader-photo"><span className="leader-initials">{l.initials}</span></div>
              <div className="leader-info">
                <h3 className="leader-name">{l.name}</h3>
                <p className="leader-role">{l.role}</p>
                <div className="leader-country">
                  <span className={`flag flag-${l.countryCode?.toLowerCase() || 'de'}`}></span>
                  <span>{l.country}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== MEMBER FEDERATIONS ========== */}
      <section className="member-federations">
        <div className="federations-next-layer">
          <span className="federations-line"></span>
          <span className="federations-subtitle">MEMBER FEDERATIONS</span>
        </div>
        <div className="federations-header">
          <h2 className="federations-title">47 NATIONS,<br />ONE CONFEDERATION</h2>
          <a href="#" className="federations-directory-btn">FULL DIRECTORY <i className="fa-solid fa-arrow-right"></i></a>
        </div>
        <div className="federations-filter">
          <div className="filter-tabs">
            {regions.map((r) => (
              <button key={r} className={`filter-tab ${filterRegion === r ? 'active' : ''}`}
                onClick={() => setFilterRegion(r)}>{r}</button>
            ))}
          </div>
          <div className="filter-count"><i className="fa-solid fa-users"></i><span>{filteredFeds.length} federations</span></div>
        </div>
        <div className="federations-grid">
          {filteredFeds.slice(0, 12).map((fed) => (
            <div className="federation-card" key={fed.id}>
              <span className={`fed-flag fed-flag-${fed.countryCode?.toLowerCase() || 'de'}`}></span>
              <div className="fed-info">
                <h3 className="fed-name">{fed.name}</h3>
                <span className="fed-code">{fed.code}</span>
                <span className="fed-since">Since {fed.since}</span>
              </div>
              <span className="fed-region">{fed.region}</span>
            </div>
          ))}
        </div>
        <div className="federations-show-all">
          <button className="show-all-btn">SHOW ALL {federations.length} MEMBERS <i className="fa-solid fa-chevron-down"></i></button>
        </div>
      </section>

      {/* ========== HERITAGE ========== */}
      <section className="heritage">
        <div className="heritage-container">
          <div className="heritage-left">
            <div className="heritage-next-layer">
              <span className="heritage-line"></span>
              <span className="heritage-subtitle">{pageData?.heritageSubtitle}</span>
            </div>
            <h2 className="heritage-title">{pageData?.heritageTitle}</h2>
            <p className="heritage-text">{pageData?.heritageText}</p>
          </div>
          <div className="heritage-right">
            <div className="heritage-cards">
              {milestones.map((m) => (
                <div className="heritage-card" key={m.id}>
                  <span className="heritage-year">{m.year}</span>
                  <span className="heritage-desc">{m.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DiscoverPage;