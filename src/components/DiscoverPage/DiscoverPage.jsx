// src/components/DiscoverPage/DiscoverPage.jsx
'use client';
import { useState } from 'react';
import './DiscoverPage.css'; // объедините все CSS-секции в этот файл

const DiscoverPage = () => {
  // Управление панелями Governance
  const [openPanels, setOpenPanels] = useState({});

  const togglePanel = (panelId) => {
    setOpenPanels((prev) => ({ ...prev, [panelId]: !prev[panelId] }));
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
          <span className="breadcrumb-subtitle">EUROPEAN SHOOTING CONFEDERATION</span>
        </div>
        <div className="about-title-row">
          <h1>THE HEART OF EUROPEAN</h1>
          <h1 className="accent">SHOOTING SPORT</h1>
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
            <h2 className="who-title">MISSION & PURPOSE</h2>
            <p className="who-text">
              The European Shooting Confederation (ESC) is the continental governing body for shooting sports, overseeing the development, regulation, and promotion of precision shooting disciplines across Europe.
            </p>
            <p className="who-text">
              We organise European Championships, youth competitions, officials' education, and work with the ISSF to deliver international standards to every member nation.
            </p>
            <div className="who-stats">
              <div className="stat-card"><span className="stat-number">47</span><span className="stat-label">MEMBER FEDERATIONS</span></div>
              <div className="stat-card"><span className="stat-number">38</span><span className="stat-label">NATIONS REPRESENTED</span></div>
              <div className="stat-card"><span className="stat-number">24+</span><span className="stat-label">ANNUAL EVENTS</span></div>
              <div className="stat-card"><span className="stat-number">48</span><span className="stat-label">YEARS OF HISTORY</span></div>
            </div>
          </div>
          <div className="who-right">
            <img src="/img/news1.jpg" alt="European Shooting Confederation" />
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
                <line x1="11" y1="1.5" x2="11" y2="3.5" stroke="#00d8f5" strokeWidth="1.5"/>
                <line x1="11" y1="18.5" x2="11" y2="20.5" stroke="#00d8f5" strokeWidth="1.5"/>
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
        <div className={`structure-block block-main ${openPanels['assembly'] ? 'has-open-panel' : ''}`}>
          <div className="block-label">LEGISLATIVE</div>
          <div className="block-info">
            <h3 className="block-name">GENERAL ASSEMBLY</h3>
            <p className="block-desc">All 47 Member Federations</p>
          </div>
          <button className="block-toggle" onClick={() => togglePanel('assembly')}>
            {openPanels['assembly'] ? 'CLOSE' : 'VIEW'} <i className={`fa-solid fa-chevron-${openPanels['assembly'] ? 'up' : 'down'}`}></i>
          </button>
        </div>
        {openPanels['assembly'] && (
          <div className="assembly-panel is-open">
            <div className="assembly-header">
              <div className="assembly-label">LEGISLATIVE</div>
              <h3 className="assembly-title">GENERAL ASSEMBLY</h3>
              <p className="assembly-description">The supreme governing body of the ESC. Meets annually to adopt regulations, elect the Executive Committee, and decide strategic direction.</p>
              <button className="panel-close" onClick={() => togglePanel('assembly')}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="assembly-federations">
              {/* 47 флагов - оставлены основные для примера */}
              <div className="assembly-member"><div className="assembly-flag flag-de"></div><div className="assembly-code">GER</div><div className="assembly-country">Germany</div></div>
              <div className="assembly-member"><div className="assembly-flag flag-fr"></div><div className="assembly-code">FRA</div><div className="assembly-country">France</div></div>
              <div className="assembly-member"><div className="assembly-flag flag-it"></div><div className="assembly-code">ITA</div><div className="assembly-country">Italy</div></div>
              <div className="assembly-member"><div className="assembly-flag flag-cz"></div><div className="assembly-code">CZE</div><div className="assembly-country">Czech Republic</div></div>
              {/* ... добавьте остальные по аналогии */}
            </div>
          </div>
        )}

        {/* Executive Committee */}
        <div className={`structure-block block-accent ${openPanels['executive'] ? 'has-open-panel' : ''}`}>
          <div className="block-label">EXECUTIVE</div>
          <div className="block-info">
            <h3 className="block-name">EXECUTIVE COMMITTEE</h3>
            <p className="block-desc">9 elected members</p>
          </div>
          <button className="block-toggle" onClick={() => togglePanel('executive')}>
            {openPanels['executive'] ? 'CLOSE' : 'VIEW'} <i className={`fa-solid fa-chevron-${openPanels['executive'] ? 'up' : 'down'}`}></i>
          </button>
        </div>
        {openPanels['executive'] && (
          <div className="assembly-panel is-open">
            <div className="assembly-header">
              <div className="assembly-label">EXECUTIVE</div>
              <h3 className="assembly-title">EXECUTIVE COMMITTEE</h3>
              <p className="assembly-description">The executive body responsible for implementing decisions of the General Assembly and managing day-to-day governance.</p>
              <button className="panel-close" onClick={() => togglePanel('executive')}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="executive-members">
              <div className="executive-member"><div className="executive-photo"><span>TR</span></div><div className="executive-info"><h4>THOMAS REINHARDT</h4><span className="executive-role">PRESIDENT</span><div className="executive-country"><span className="assembly-flag flag-de"></span>Germany</div></div></div>
              <div className="executive-member"><div className="executive-photo"><span>SM</span></div><div className="executive-info"><h4>SOFIA MARCHETTI</h4><span className="executive-role">SECRETARY GENERAL</span><div className="executive-country"><span className="assembly-flag flag-it"></span>Italy</div></div></div>
              {/* ... остальные члены */}
            </div>
          </div>
        )}

        {/* Комитеты */}
        <div className="committee-cards">
          {['Technical Committee', 'Development Committee', 'Athletes Committee', 'Judges Committee'].map((name) => {
            const id = name.toLowerCase().replace(/\s/g, '');
            return (
              <div key={id} className="committee-card" onClick={() => togglePanel(id)}>
                <div className="committee-card-content">
                  <h4 className="committee-name">{name.toUpperCase()}</h4>
                  <p className="committee-members">{id === 'technicalcommittee' ? '6 experts' : id === 'developmentcommittee' ? '5 members' : id === 'athletescommittee' ? '4 athletes' : '4 senior judges'}</p>
                </div>
                <i className={`fa-solid fa-chevron-${openPanels[id] ? 'up' : 'down'} committee-arrow`}></i>
              </div>
            );
          })}
        </div>
        {/* Здесь можно добавить панели для каждого комитета аналогично */}
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
          <div className="leader-card">
            <div className="leader-photo"><span className="leader-initials">TR</span></div>
            <div className="leader-info"><h3 className="leader-name">THOMAS REINHARDT</h3><p className="leader-role">PRESIDENT</p><div className="leader-country"><span className="flag flag-de"></span><span>Germany</span></div></div>
          </div>
          <div className="leader-card">
            <div className="leader-photo"><span className="leader-initials">SM</span></div>
            <div className="leader-info"><h3 className="leader-name">SOFIA MARCHETTI</h3><p className="leader-role">SECRETARY GENERAL</p><div className="leader-country"><span className="flag flag-it"></span><span>Italy</span></div></div>
          </div>
          <div className="leader-card">
            <div className="leader-photo"><span className="leader-initials">JN</span></div>
            <div className="leader-info"><h3 className="leader-name">JAKUB NOVÁK</h3><p className="leader-role">TECHNICAL DIRECTOR</p><div className="leader-country"><span className="flag flag-cz"></span><span>Czech Republic</span></div></div>
          </div>
          <div className="leader-card">
            <div className="leader-photo"><span className="leader-initials">IL</span></div>
            <div className="leader-info"><h3 className="leader-name">INGRID LARSEN</h3><p className="leader-role">DEVELOPMENT OFFICER</p><div className="leader-country"><span className="flag flag-no"></span><span>Norway</span></div></div>
          </div>
        </div>
      </section>

      {/* ========== MEMBER FEDERATIONS ========== */}
      <section className="member-federations">
        <div className="federations-next-layer"><span className="federations-line"></span><span className="federations-subtitle">MEMBER FEDERATIONS</span></div>
        <div className="federations-header">
          <div className="federations-title-row"><h2 className="federations-title">47 NATIONS,<br />ONE CONFEDERATION</h2></div>
          <a href="#" className="federations-directory-btn">FULL DIRECTORY <i className="fa-solid fa-arrow-right"></i></a>
        </div>
        <div className="federations-filter">
          <div className="filter-tabs">
            {['ALL', 'W.EUROPE', 'SCANDINAVIA', 'C.EUROPE', 'E.EUROPE', 'S.EUROPE', 'CAUCASUS'].map((r) => (
              <button key={r} className={`filter-tab ${r === 'ALL' ? 'active' : ''}`}>{r}</button>
            ))}
          </div>
          <div className="filter-count"><i className="fa-solid fa-users"></i><span>46 federations</span></div>
        </div>
        <div className="federations-grid">
          {/* Примеры карточек */}
          <div className="federation-card"><span className="fed-flag fed-flag-de"></span><div className="fed-info"><h3 className="fed-name">GERMANY</h3><span className="fed-code">GER</span><span className="fed-since">Since 1976</span></div><span className="fed-region">W.EUROPE</span></div>
          <div className="federation-card"><span className="fed-flag fed-flag-fr"></span><div className="fed-info"><h3 className="fed-name">FRANCE</h3><span className="fed-code">FRA</span><span className="fed-since">Since year</span></div><span className="fed-region">W.EUROPE</span></div>
          {/* ... ещё 44 карточки */}
        </div>
        <div className="federations-show-all"><button className="show-all-btn">SHOW ALL 46 MEMBERS <i className="fa-solid fa-chevron-down"></i></button></div>
      </section>

      {/* ========== HERITAGE ========== */}
      <section className="heritage">
        <div className="heritage-container">
          <div className="heritage-left">
            <div className="heritage-next-layer"><span className="heritage-line"></span><span className="heritage-subtitle">HERITAGE</span></div>
            <h2 className="heritage-title">NEARLY FIVE DECADES</h2>
            <p className="heritage-text">Founded in 1978 in Vienna, the ESC has grown from a coordination forum into a full continental federation governing 47 national bodies, 12 disciplines, and thousands of competitive athletes each season.</p>
          </div>
          <div className="heritage-right">
            <div className="heritage-cards">
              <div className="heritage-card"><span className="heritage-year">1978</span><span className="heritage-desc">ESC founded in Vienna, Austria</span></div>
              <div className="heritage-card"><span className="heritage-year">1983</span><span className="heritage-desc">First European Championship organised</span></div>
              <div className="heritage-card"><span className="heritage-year">2001</span><span className="heritage-desc">Youth League programme launched</span></div>
              <div className="heritage-card"><span className="heritage-year">2018</span><span className="heritage-desc">Digital infrastructure modernised</span></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DiscoverPage;