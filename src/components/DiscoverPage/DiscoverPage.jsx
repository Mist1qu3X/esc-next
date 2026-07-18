'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import './DiscoverPage.css';

const DiscoverPage = () => {
  const [pageData, setPageData] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [federations, setFederations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [governance, setGovernance] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [coreValues, setCoreValues] = useState([]);
  const [openPanels, setOpenPanels] = useState({});
  const [filterRegion, setFilterRegion] = useState('ALL');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutRes, leadersRes, fedsRes, milestonesRes, govRes, membersRes, committeesRes, coreRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/about-pages?populate=*`),
          axios.get(`${config.API_URL}/api/leaders?populate=*&sort=order:asc`),
          axios.get(`${config.API_URL}/api/federations?populate=*&pagination[limit]=100`),
          axios.get(`${config.API_URL}/api/heritage-milestones?sort=order:asc`),
          axios.get(`${config.API_URL}/api/governances?sort=order:asc&pagination[limit]=20`),
          axios.get(`${config.API_URL}/api/committee-members?populate=*&pagination[limit]=100`),
          axios.get(`${config.API_URL}/api/committees?populate=*&sort=order:asc&pagination[limit]=100`),
          axios.get(`${config.API_URL}/api/core-values?sort=order:asc`),
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
        setCommittees(committeesRes.data?.data || []);
        setCoreValues(coreRes.data?.data || []);
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
    if (img.url) return img.url.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
    return null;
  };

  // Функция для получения URL флага из Strapi (PNG)
  const getFlagUrl = (flag) => {
    if (!flag) return null;
    // Если пришел объект Media из Strapi
    if (flag.url) {
      return flag.url.startsWith('http') ? flag.url : `${config.API_URL}${flag.url}`;
    }
    // Если пришел код страны
    if (typeof flag === 'string') {
      return `${config.API_URL}/uploads/flags/${flag.toLowerCase()}.png`;
    }
    return null;
  };

  // Иконки CORE VALUES по ключу iconKey из Strapi
  const renderCoreIcon = (key) => {
    switch (key) {
      case 'shield':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 1L3 5V11C3 15.5 6.5 19.5 11 21C15.5 19.5 19 15.5 19 11V5L11 1Z" stroke="#00d8f5" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        );
      case 'globe':
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke="#00d8f5" strokeWidth="1.5"/>
            <ellipse cx="11" cy="11" rx="4.5" ry="9.5" stroke="#00d8f5" strokeWidth="1.5"/>
            <line x1="2" y1="11" x2="20" y2="11" stroke="#00d8f5" strokeWidth="1.5"/>
          </svg>
        );
      case 'target':
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="#00d8f5" strokeWidth="1.5"/>
            <circle cx="11" cy="11" r="6" stroke="#00d8f5" strokeWidth="1.5"/>
            <circle cx="11" cy="11" r="2" fill="#00d8f5"/>
          </svg>
        );
    }
  };

  const assembly = governance.find(g => g.type === 'legislative');
  const executive = governance.find(g => g.type === 'executive');
  
  // Участники комитета по связи (relation). У участника committee — объект { id, name, ... } или null
  const getCommitteeMembers = (committeeId) => {
    return committeeMembers.filter(m => (m.committee?.id ?? m.committee) === committeeId);
  };

  // Карточки комитетов строятся из коллекции Committee (названия редактируются в Strapi)
  const committeeCards = committees.map((c) => {
    const membersList = getCommitteeMembers(c.id);
    // Счётчик задаётся в Strapi (число + слово). Если не задан — считаем привязанных участников.
    const count = c.membersCount ?? membersList.length;
    const status = c.membersStatus || 'members';
    return {
      id: `committee_${c.id}`,
      committeeId: c.id,
      name: c.name,
      members: `${count} ${status}`,
      description: c.description || `${c.name} oversees ESC activities.`,
    };
  });

  const handleFullDirectory = () => {
    router.push('/members');
  };

  const handleShowAllMembers = () => {
    router.push('/members');
  };

  const handleLeaderClick = (leaderId) => {
    router.push(`/leaders/${leaderId}`);
  };

  return (
    <>
      <section
        className={`about-hero ${pageData?.heroImage ? 'has-hero-image' : ''}`}
        style={pageData?.heroImage ? { '--hero-img': `url(${getImageUrl(pageData.heroImage)})` } : undefined}
      >
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

      <section
        className={`who-we-are ${pageData?.missionImage ? 'has-bg' : ''}`}
        style={pageData?.missionImage ? { '--who-img': `url(${getImageUrl(pageData.missionImage)})` } : undefined}
      >
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
        </div>
      </section>

      <section className="core-values">
        <div className="core-next-layer">
          <span className="core-line"></span>
          <span className="core-subtitle">CORE VALUES</span>
        </div>
        <div className="core-cards">
          {coreValues.map((cv) => (
            <div className="core-card" key={cv.id}>
              <div className="core-icon-box">
                {renderCoreIcon(cv.iconKey)}
              </div>
              <h3 className="core-card-title">{cv.title}</h3>
              <p className="core-card-text">{cv.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="member-federations">
        <div className="federations-next-layer">
          <span className="federations-line"></span>
          <span className="federations-subtitle">MEMBER FEDERATIONS</span>
        </div>
        <div className="federations-header">
          <h2 className="federations-title">47 NATIONS,<br />ONE CONFEDERATION</h2>
          <button className="federations-directory-btn" onClick={handleFullDirectory}>
            FULL DIRECTORY <i className="fa-solid fa-arrow-right"></i>
          </button>
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
              <img 
                src={getFlagUrl(fed.flag || fed.countryCode)} 
                alt={fed.countryCode}
                className="fed-flag-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="fed-info">
                <h3 className="fed-name">{fed.country}</h3>
                <span className="fed-code">{fed.countryCode}</span>
                <span className="fed-since">Since {fed.since}</span>
              </div>
              <span className="fed-region">{fed.region}</span>
            </div>
          ))}
        </div>
        <div className="federations-show-all">
          <button className="show-all-btn" onClick={handleShowAllMembers}>
            SHOW ALL {federations.length} MEMBERS <i className="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      </section>

      <section className="heritage">
        <div className="heritage-header">
          <div className="heritage-next-layer">
            <span className="heritage-line"></span>
            <span className="heritage-subtitle">{pageData?.heritageSubtitle}</span>
          </div>
          <h2 className="heritage-title">{pageData?.heritageTitle}</h2>
          {pageData?.heritageText && <p className="heritage-text">{pageData?.heritageText}</p>}
        </div>
        <div className="heritage-cards">
          {milestones.map((m) => (
            <div className="heritage-card" key={m.id}>
              <span className="heritage-card-head">
                <span className="heritage-year">{m.year}</span>
                {m.title && (
                  <>
                    <span className="heritage-sep">|</span>
                    <span className="heritage-name">{m.title}</span>
                  </>
                )}
              </span>
              <span className="heritage-desc">{m.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="leadership">
        <div className="leadership-header">
          <div className="leadership-naming">
            <span className="leadership-line"></span>
            <span className="leadership-title">LEADERSHIP</span>
          </div>
          <button className="leadership-directory" onClick={handleFullDirectory}>
            FULL DIRECTORY <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <div className="leadership-cards">
          {leaders.slice(0, 3).map((l) => (
            <div className="leader-card" key={l.id} onClick={() => handleLeaderClick(l.id)}>
              <div className="leader-photo">
                {l.image ? (
                  <img src={getImageUrl(l.image)} alt={l.name} className="leader-photo-img" />
                ) : (
                  <span className="leader-initials">{l.initials}</span>
                )}
              </div>
              <div className="leader-info">
                <h3 className="leader-name">{l.name}</h3>
                <p className="leader-role">{l.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="structure">
        <div className="structure-next-layer">
          <span className="structure-line"></span>
          <span className="structure-subtitle">STRUCTURE</span>
        </div>
        <h2 className="structure-title">GOVERNANCE</h2>

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
                      <img 
                        src={getFlagUrl(fed.flag || fed.countryCode)} 
                        alt={fed.countryCode}
                        className="assembly-flag-img"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="assembly-code">{fed.countryCode}</div>
                      <div className="assembly-country">{fed.country}</div>
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
              <div className="executive-panel is-open">
                <div className="executive-panel-header">
                  <div className="assembly-label">EXECUTIVE</div>
                  <h3 className="assembly-title">{executive.name}</h3>
                  <p className="assembly-description">{executive.description}</p>
                  <button className="panel-close" onClick={() => togglePanel('executive')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="executive-cards-grid">
                  {leaders.slice(0, 9).map((leader) => (
                    <div className="executive-new-card" key={leader.id}>
                      <div className="executive-card-image">
                        {leader.image ? (
                          <img src={getImageUrl(leader.image)} alt={leader.name} />
                        ) : (
                          <div className="executive-card-placeholder">
                            <span>{leader.initials}</span>
                          </div>
                        )}
                        <div className="executive-card-role-badge">{leader.role?.toUpperCase()}</div>
                      </div>
                      <div className="executive-card-info">
                        <h4 className="executive-card-name">{leader.name}</h4>
                        <div className="executive-card-contact">
                          <div className="executive-contact-item">
                            <i className="fa-regular fa-envelope"></i>
                            <span>{leader.email || 'info@esc-shooting.eu'}</span>
                          </div>
                          <div className="executive-contact-item">
                            <i className="fa-solid fa-phone"></i>
                            <span>{leader.phone || '+49 30 1234 5678'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Комитеты — названия и состав редактируются в Strapi (коллекция Committee) */}
        {committeeCards.length > 0 && (
          <div className="committee-cards">
            {committeeCards.map((c) => (
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
        {committeeCards.map((c) => {
        const members = getCommitteeMembers(c.committeeId);
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
                      <div className="executive-photo">
                        {m.image ? (
                          <img src={getImageUrl(m.image)} alt={m.name} className="executive-photo-img" />
                        ) : (
                          <span>{m.initials}</span>
                        )}
                      </div>
                      <div className="executive-info">
                        <h4>{m.name}</h4>
                        <span className="executive-role">{m.role}</span>
                        <div className="executive-country">
                          <img 
                            src={getFlagUrl(m.flag || m.countryCode)} 
                            alt={m.countryCode}
                            className="executive-flag-img"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <span>{m.country}</span>
                        </div>
                        {/* УДАЛИТЬ email и phone для комитетов */}
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
    </>
  );
};

export default DiscoverPage;