'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './SelectedEventPage.css';

const SelectedEventPage = ({ slug }) => {
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [streams, setStreams] = useState([]);

  const tabs = ['OVERVIEW', 'DOCUMENTS', 'RESULTS', 'LIVE & MEDIA'];

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${config.API_URL}/api/events?filters[slug][$eq]=${slug}&populate=*`);
        if (res.data?.data?.length > 0) setEvent(res.data.data[0]);
      } catch (e) { console.error(e); }
    };
    fetchEvent();
  }, [slug]);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const res = await axios.get(`${config.API_URL}/api/live-streams?populate=*&pagination[limit]=10`);
        setStreams(res.data?.data || []);
      } catch (e) { console.error(e); }
    };
    fetchStreams();
  }, []);

  if (!event) {
    return (
      <section className="selected-event-header" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff', fontSize: '20px' }}>Loading...</p>
      </section>
    );
  }

  const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img.startsWith('http') ? img : `${config.API_URL}${img}`;
    return img.url?.startsWith('http') ? img.url : `${config.API_URL}${img.url}`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  const disciplines = event.disciplines?.split(',') || [
    '10M AIR RIFLE MEN', '10M AIR RIFLE WOMEN', '10M AIR RIFLE MIXED TEAM',
    '10M AIR PISTOL MEN', '10M AIR PISTOL WOMEN', '10M AIR PISTOL MIXED TEAM'
  ];

  const getPlatformClass = (p) => {
    if (p === 'youtube') return 'youtube';
    if (p === 'twitch') return 'twitch';
    if (p === 'facebook') return 'facebook';
    return 'youtube';
  };

  return (
    <>
      {/* HERO */}
      <section className="selected-event-header" style={{ backgroundImage: `url(${getImageUrl(event.image) || '/img/event1.png'})` }}>
        <div className="event-overlay"></div>
        <div className="event-breadcrumbs">
          <span className="event-breadcrumb">HOME</span><span className="event-breadcrumb-sep">›</span>
          <span className="event-breadcrumb">EVENTS</span><span className="event-breadcrumb-sep">›</span>
          <span className="event-breadcrumb-active">DETAIL</span>
        </div>
        <div className="event-status-row">
          <span className="event-status-upcoming">{event.statusEvent || 'UPCOMING'}</span>
          <span className="event-status-type">{event.type || 'SENIOR CHAMPIONSHIP'}</span>
        </div>
        <div className="event-header-content">
          <h1 className="event-title">{event.name}</h1>
          <div className="event-info-row">
            <div className="event-info-item"><i className="fa-solid fa-location-dot"></i><span>{event.location}</span></div>
            <span className="event-info-sep">·</span>
            <div className="event-info-item"><i className="fa-regular fa-calendar"></i><span>{formatDate(event.date)} - {formatDate(event.endDate)}</span></div>
            <span className="event-info-sep">·</span>
            <div className="event-info-item"><i className="fa-solid fa-users"></i><span>{event.athletes || '480+'} athletes</span></div>
            <span className="event-info-sep event-info-sep-dot">·</span>
            <div className="event-info-item"><span>{event.nations || '38'} nations</span></div>
          </div>
        </div>
        <button className="event-entry-btn">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>ENTRY SYSTEM
        </button>
      </section>

      {/* FILTERS */}
      <section className="event-filters">
        <div className="event-filters-nav">
          {tabs.map((t) => (
            <button key={t} className={`event-filter-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>
      </section>

      {/* CONTENT */}
      <section className="event-content">
        <div className="event-content-wrapper">
          <div className="event-main-body">
            <h2 className="event-section-title">EVENT OVERVIEW</h2>
            <p className="event-description">{event.description || 'The 2026 European Championship in 10m Air Weapons is the premier ESC event of the season.'}</p>
            
            <h3 className="event-subtitle">Competition Disciplines</h3>
            <div className="disciplines-grid">
              {disciplines.map((d, i) => (
                <div className="discipline-card" key={i}><span className="discipline-dot"></span><span className="discipline-name">{d.trim()}</span></div>
              ))}
            </div>

            <h3 className="event-subtitle">VENUE</h3>
            <div className="venue-container">
              <div className="venue-image" style={{ backgroundImage: `url(${getImageUrl(event.venueImage) || getImageUrl(event.image) || '/img/news3.jpg'})` }}></div>
              <div className="venue-info">
                <h4 className="venue-name">{event.venue || event.location}</h4>
                <span className="venue-location">{event.location}</span>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="event-sidebar">
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">EVENT DETAILS</h4>
              <div className="sidebar-divider"></div>
              <div className="event-detail-list">
                <div className="detail-item"><i className="fa-regular fa-calendar detail-icon"></i><div className="detail-content"><span className="detail-label">DATES</span><span className="detail-value">{formatDate(event.date)} - {formatDate(event.endDate)}</span></div></div>
                <div className="sidebar-divider"></div>
                <div className="detail-item"><i className="fa-solid fa-location-dot detail-icon"></i><div className="detail-content"><span className="detail-label">VENUE</span><span className="detail-value">{event.venue || 'Sportovní hala Praha'}</span></div></div>
                <div className="sidebar-divider"></div>
                <div className="detail-item"><i className="fa-solid fa-location-dot detail-icon"></i><div className="detail-content"><span className="detail-label">LOCATION</span><span className="detail-value">{event.location}</span></div></div>
                <div className="sidebar-divider"></div>
                <div className="detail-item"><i className="fa-solid fa-user-group detail-icon"></i><div className="detail-content"><span className="detail-label">NATIONS</span><span className="detail-value">{event.nations || '38'}</span></div></div>
                <div className="sidebar-divider"></div>
                <div className="detail-item"><i className="fa-solid fa-user-group detail-icon"></i><div className="detail-content"><span className="detail-label">ATHLETES</span><span className="detail-value">{event.athletes || '480+'}</span></div></div>
              </div>
            </div>

            <div className="sidebar-block">
              <h4 className="sidebar-block-title">QUICK ACTIONS</h4>
              <div className="sidebar-divider"></div>
              <div className="quick-actions-list">
                <button className="quick-action-btn"><i className="fa-solid fa-arrow-up-right-from-square"></i><span>ENTRY SYSTEM</span></button>
                <div className="sidebar-divider"></div>
                <button className="quick-action-btn"><i className="fa-solid fa-download"></i><span>TECHNICAL PACKAGE</span></button>
                <div className="sidebar-divider"></div>
                <button className="quick-action-btn"><i className="fa-solid fa-trophy"></i><span>VIEW RESULTS</span></button>
              </div>
            </div>

            <div className="sidebar-block">
              <h4 className="sidebar-block-title">CONTACT</h4>
              <div className="sidebar-divider"></div>
              <div className="contact-item-sidebar"><i className="fa-regular fa-envelope"></i><a href="mailto:technical@esc-shooting.eu">technical@esc-shooting.eu</a></div>
            </div>

            {streams.length > 0 && (
              <div className="sidebar-block live-stream-block">
                <div className="live-stream-header">
                  <div className="live-stream-indicator">
                    <span className="live-waves"><i className="fa-solid fa-wifi"></i></span>
                    <span className="live-stream-text">LIVE STREAM</span>
                  </div>
                  <span className="on-air-badge"><span className="on-air-dot"></span>ON AIR</span>
                </div>
                <div className="live-platforms">
                  {streams.slice(0, 3).map((s) => (
                    <div key={s.id} className={`live-platform-card ${getPlatformClass(s.platform)}-card`} onClick={() => window.open(s.url, '_blank')}>
                      <div className={`platform-icon ${getPlatformClass(s.platform)}-icon`}>
                        <i className={`fa-brands fa-${s.platform}`}></i>
                      </div>
                      <div className="platform-info">
                        <span className="platform-name">{s.platform?.toUpperCase()}</span>
                        <div className="platform-meta">
                          <span className="platform-stream">{s.title}</span>
                          <div className="platform-stats">
                            <div className="stats-col">
                              <span className="viewers-count">{s.views}</span>
                              <span className="watching-text">watching</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="platform-go-btn"><i className="fa-solid fa-arrow-up-right-from-square"></i></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
};

export default SelectedEventPage;