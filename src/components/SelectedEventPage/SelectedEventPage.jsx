'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import DocumentsPage from '@/components/DocumentsPage/DocumentsPage';
import ResultsRankingsPage from '@/components/ResultsRankingsPage/ResultsRankingsPage';
import './SelectedEventPage.css';

// Расписание ALL EVENTS (пока нет отдельного поля/коллекции — демо-данные)
const SCHEDULE = [
  { mon: 'Nov', day: '04', items: [
    { time: '12:30 - 13:30', event: 'Air Rifle 3P Men', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Unofficial Training 10m Events', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Equipment Control', stage: 'Qualification' },
    { time: '17:00', event: 'Technical Meeting', stage: 'Qualification' },
  ] },
  { mon: 'Nov', day: '05', items: [
    { time: '08:00 - 19:00', event: 'Equipment Control', stage: 'Qualification' },
    { time: '08:30 - 11:00', event: 'Pre-event Training 10m Moving Target Mixed Men', stage: 'Qualification' },
    { time: '08:30 - 11:00', event: 'Pre-event Training 10m Moving Target Mixed Women', stage: 'Qualification' },
    { time: '08:30 - 11:00', event: 'Pre-event Training 10m Moving Target Men Junior', stage: 'Qualification' },
    { time: '08:30 - 11:00', event: 'Pre-event Training 10m Moving Target Women Junior', stage: 'Qualification' },
    { time: '11:00 - 19:00', event: '10m Moving Target Mixed Men', stage: 'Qualification' },
    { time: '11:00 - 19:00', event: '10m Moving Target Mixed Women', stage: 'Qualification' },
  ] },
  { mon: 'Nov', day: '07', items: [
    { time: '12:30 - 13:30', event: 'Air Rifle 3P Men', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Unofficial Training 10m Events', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Equipment Control', stage: 'Qualification' },
    { time: '17:00', event: 'Technical Meeting', stage: 'Qualification' },
  ] },
  { mon: 'Nov', day: '08', items: [
    { time: '12:30 - 13:30', event: 'Air Rifle 3P Men', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Unofficial Training 10m Events', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Equipment Control', stage: 'Qualification' },
    { time: '17:00', event: 'Technical Meeting', stage: 'Qualification' },
  ] },
];

const getImageUrl = (img) => {
  if (!img) return null;
  const abs = (u) => (u && (u.startsWith('http') ? u : `${config.API_URL}${u}`));
  if (typeof img === 'string') return abs(img);
  if (img.url) return abs(img.url);
  if (img.data?.attributes?.url) return abs(img.data.attributes.url);
  if (Array.isArray(img.data) && img.data[0]?.attributes?.url) return abs(img.data[0].attributes.url);
  if (img[0]?.url) return abs(img[0].url);
  return null;
};

const SelectedEventPage = ({ slug }) => {
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [streams, setStreams] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const router = useRouter();

  const tabs = ['OVERVIEW', 'DOCUMENTS', 'RESULTS', 'LIVE & MEDIA'];

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const [evRes, schedRes] = await Promise.all([
          axios.get(`${config.API_URL}/api/events?filters[slug][$eq]=${slug}&populate[image]=true&populate[venueImage]=true`),
          axios.get(`${config.API_URL}/api/event-schedules?filters[eventSlug][$eq]=${slug}&sort=order:asc&pagination[pageSize]=200`).catch(() => ({ data: { data: [] } })),
        ]);
        if (evRes.data?.data?.length > 0) setEvent(evRes.data.data[0]);
        setSchedule(schedRes.data?.data || []);
      } catch (e) { console.error(e); }
    };
    fetchEvent();
  }, [slug]);

  useEffect(() => {
    const fetchExtra = async () => {
      const sRes = await axios.get(`${config.API_URL}/api/live-streams?populate[thumbnail]=true&pagination[pageSize]=10`).catch(() => ({ data: { data: [] } }));
      setStreams(sRes.data?.data || []);
    };
    fetchExtra();
  }, []);

  if (!event) {
    return (
      <section className="selected-event-header" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff', fontSize: '20px' }}>Loading...</p>
      </section>
    );
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  const disciplines = event.disciplines?.split(',') || [
    '10M AIR RIFLE MEN', '10M AIR RIFLE WOMEN', '10M AIR RIFLE MIXED TEAM',
    '10M AIR PISTOL MEN', '10M AIR PISTOL WOMEN', '10M AIR PISTOL MIXED TEAM',
  ];

  // ALL EVENTS: реальное расписание из Strapi, иначе демо
  const groupSchedule = (rows) => {
    const groups = {};
    rows.forEach((r) => {
      const d = new Date(r.date);
      if (!groups[r.date]) groups[r.date] = {
        mon: d.toLocaleDateString('en-US', { month: 'short' }),
        day: String(d.getDate()).padStart(2, '0'),
        date: r.date,
        items: [],
      };
      groups[r.date].items.push({ time: r.time, event: r.title, stage: r.stage });
    });
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  };
  const displaySchedule = schedule.length > 0 ? groupSchedule(schedule) : SCHEDULE;

  const platformClass = (p) => ((p || '').toLowerCase() === 'facebook' ? 'facebook' : 'youtube');

  // LIVE STREAM: twitch убран
  const liveStreams = streams.filter((s) => (s.platform || '').toLowerCase() !== 'twitch').slice(0, 3);
  const anyLive = liveStreams.some((s) => (s.streamStatus || '').toLowerCase() === 'live');

  const liveStreamBlock = (
    <div className="sidebar-block live-stream-block">
      <div className="live-stream-header">
        <div className="live-stream-indicator">
          <span className="live-waves"><i className="fa-solid fa-wifi"></i></span>
          <span className="live-stream-text">LIVE STREAM</span>
        </div>
        {liveStreams.length > 0 && (
          anyLive
            ? <span className="on-air-badge"><span className="on-air-dot"></span>ON AIR</span>
            : <span className="upcoming-badge"><span className="upcoming-dot"></span>UPCOMING</span>
        )}
      </div>
      {liveStreams.length > 0 ? (
        <div className="live-platforms">
          {liveStreams.map((s) => (
            <div key={s.id} className={`live-platform-card ${platformClass(s.platform)}-card`} onClick={() => s.url && window.open(s.url, '_blank')}>
              <div className={`platform-icon ${platformClass(s.platform)}-icon`}>
                <i className={`fa-brands fa-${platformClass(s.platform)}`}></i>
              </div>
              <div className="platform-info">
                <span className="platform-name">{platformClass(s.platform).toUpperCase()}</span>
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
      ) : (
        <div className="stream-scheduled">
          <i className="fa-regular fa-circle-play stream-scheduled-icon"></i>
          <span className="stream-scheduled-title">STREAM SCHEDULED</span>
          <span className="stream-scheduled-text">Goes live when the event begins. Available on YouTube &amp; Facebook.</span>
        </div>
      )}
    </div>
  );

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
          <div className="event-info-bar">
            <div className="event-info-row">
              <div className="event-info-item"><i className="fa-solid fa-location-dot"></i><span>{event.location}</span></div>
              <span className="event-info-sep">·</span>
              <div className="event-info-item"><i className="fa-regular fa-calendar"></i><span>{formatDate(event.date)} - {formatDate(event.endDate)}</span></div>
              <span className="event-info-sep">·</span>
              <div className="event-info-item"><i className="fa-solid fa-users"></i><span>{event.athletes || '480+'} athletes · {event.nations || '38'} nations</span></div>
            </div>
            <button className="event-entry-btn">
              <i className="fa-solid fa-arrow-up-right-from-square"></i>ENTRY SYSTEM
            </button>
          </div>
        </div>
      </section>

      {/* TABS */}
      <section className="event-filters">
        <div className="event-filters-nav">
          {tabs.map((t) => (
            <button key={t} className={`event-filter-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>
      </section>

      {/* CONTENT */}
      <section className="event-content">
        <div className={`event-content-wrapper ${(activeTab === 'DOCUMENTS' || activeTab === 'RESULTS') ? 'event-content-full' : ''}`}>
          <div className="event-main-body">
            {activeTab === 'OVERVIEW' && (
              <>
                <h2 className="event-section-title">EVENT OVERVIEW</h2>
                <p className="event-description">{event.description || 'The 2026 European Championship in 10m Air Weapons is the premier ESC event of the season.'}</p>

                <h3 className="event-subtitle">Competition Disciplines</h3>
                <div className="disciplines-grid">
                  {disciplines.map((d, i) => (
                    <div className="se-discipline-card" key={i}><span className="discipline-dot"></span><span className="discipline-name">{d.trim()}</span></div>
                  ))}
                </div>

                {/* ALL EVENTS (вместо VENUE) */}
                <h3 className="event-subtitle ae-title">ALL EVENTS</h3>
                <div className="all-events-table">
                  <div className="ae-header">
                    <span>DATES</span><span>TIME</span><span>EVENT</span><span>STAGES</span>
                  </div>
                  {displaySchedule.map((g, gi) => (
                    <div className="ae-group" key={gi}>
                      <div className="ae-date"><span className="ae-date-mon">{g.mon}</span><span className="ae-date-day">{g.day}</span></div>
                      <div className="ae-items">
                        {g.items.map((it, ii) => (
                          <div className="ae-row" key={ii}>
                            <span className="ae-time">{it.time}</span>
                            <span className="ae-event">{it.event}</span>
                            <span className="ae-stage">{it.stage}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ae-pagination">
                  {[1, 2, 3].map((p) => <button key={p} className={`ae-page-btn ${p === 1 ? 'active' : ''}`}>{p}</button>)}
                </div>
              </>
            )}

            {activeTab === 'DOCUMENTS' && (
              <div className="event-embed"><DocumentsPage embedded /></div>
            )}

            {activeTab === 'RESULTS' && (
              <div className="event-embed"><ResultsRankingsPage embedded /></div>
            )}

            {activeTab === 'LIVE & MEDIA' && (
              <>
                <h2 className="event-section-title">LIVE &amp; MEDIA</h2>
                <p className="event-description">Live streams, highlights and media coverage for {event.name}.</p>
                {liveStreams.length > 0 ? (
                  <div className="event-media-streams">
                    {liveStreams.map((s) => (
                      <div key={s.id} className={`event-media-card ${platformClass(s.platform)}-card`} style={{ backgroundImage: `url(${getImageUrl(s.thumbnail)})` }} onClick={() => s.url && window.open(s.url, '_blank')}>
                        <div className="event-media-overlay"></div>
                        <div className="event-media-badge">
                          <i className={`fa-brands fa-${platformClass(s.platform)}`}></i>
                          <span>{platformClass(s.platform).toUpperCase()}</span>
                        </div>
                        <div className="event-media-info">
                          <span className="event-media-title">{s.title}</span>
                          <span className="event-media-meta">{s.views} watching</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="stream-scheduled" style={{ maxWidth: 480 }}>
                    <i className="fa-regular fa-circle-play stream-scheduled-icon"></i>
                    <span className="stream-scheduled-title">STREAM SCHEDULED</span>
                    <span className="stream-scheduled-text">Goes live when the event begins. Available on YouTube &amp; Facebook.</span>
                  </div>
                )}
                <button className="event-tab-cta" onClick={() => router.push('/media')}>GO TO MEDIA &amp; NEWS ›</button>
              </>
            )}
          </div>

          {/* SIDEBAR (скрыт на DOCUMENTS/RESULTS — там встроенные страницы во всю ширину) */}
          {activeTab !== 'DOCUMENTS' && activeTab !== 'RESULTS' && (
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
                <button className="quick-action-btn" onClick={() => router.push('/results')}><i className="fa-solid fa-trophy"></i><span>VIEW RESULTS</span></button>
              </div>
            </div>

            <div className="sidebar-block">
              <h4 className="sidebar-block-title">CONTACT</h4>
              <div className="sidebar-divider"></div>
              <div className="contact-item-sidebar"><i className="fa-regular fa-envelope"></i><a href="mailto:technical@esc-shooting.eu">technical@esc-shooting.eu</a></div>
            </div>

            {liveStreamBlock}
          </aside>
          )}
        </div>
      </section>
    </>
  );
};

export default SelectedEventPage;
