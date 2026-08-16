'use client';
import { useState, useEffect } from 'react';
import { cachedGet } from '@/lib/apiCache';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import StreamPlayer, { canEmbed, ytThumb } from '@/components/StreamPlayer/StreamPlayer';
import PageLoader from '@/components/LoadingResults/PageLoader';
import TargetLoader from '@/components/LoadingResults/TargetLoader';
import { fileTypeMeta, previewUrlFor } from '@/lib/fileType';
import { downloadFile as forceDownload } from '@/lib/download';
import './SelectedEventPage.css';
import '@/components/DocumentsPage/DocumentsPage.css';

// Расписание ALL EVENTS (пока нет отдельного поля/коллекции — демо-данные).
// В демо намеренно пропущен день (06.11) — заполняется как «день отдыха» логикой ниже.
const SCHEDULE = [
  { mon: 'Nov', day: '04', date: '2026-11-04', items: [
    { time: '12:30 - 13:30', event: 'Air Rifle 3P Men', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Unofficial Training 10m Events', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Equipment Control', stage: 'Qualification' },
    { time: '17:00', event: 'Technical Meeting', stage: 'Qualification' },
  ] },
  { mon: 'Nov', day: '05', date: '2026-11-05', items: [
    { time: '08:00 - 19:00', event: 'Equipment Control', stage: 'Qualification' },
    { time: '08:30 - 11:00', event: 'Pre-event Training 10m Moving Target Mixed Men', stage: 'Qualification' },
    { time: '08:30 - 11:00', event: 'Pre-event Training 10m Moving Target Mixed Women', stage: 'Qualification' },
    { time: '08:30 - 11:00', event: 'Pre-event Training 10m Moving Target Men Junior', stage: 'Qualification' },
    { time: '08:30 - 11:00', event: 'Pre-event Training 10m Moving Target Women Junior', stage: 'Qualification' },
    { time: '11:00 - 19:00', event: '10m Moving Target Mixed Men', stage: 'Qualification' },
    { time: '11:00 - 19:00', event: '10m Moving Target Mixed Women', stage: 'Qualification' },
  ] },
  { mon: 'Nov', day: '07', date: '2026-11-07', items: [
    { time: '12:30 - 13:30', event: 'Air Rifle 3P Men', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Unofficial Training 10m Events', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Equipment Control', stage: 'Qualification' },
    { time: '17:00', event: 'Technical Meeting', stage: 'Qualification' },
  ] },
  { mon: 'Nov', day: '08', date: '2026-11-08', items: [
    { time: '12:30 - 13:30', event: 'Air Rifle 3P Men', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Unofficial Training 10m Events', stage: 'Qualification' },
    { time: '12:00 - 18:00', event: 'Equipment Control', stage: 'Qualification' },
    { time: '17:00', event: 'Technical Meeting', stage: 'Qualification' },
  ] },
];

// Прибавить n дней к ISO-дате (yyyy-mm-dd); полдень исключает сдвиг из-за таймзоны
const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Заполнить пропущенные между сессиями дни «днём отдыха», чтобы пропуск не выглядел дырой в данных
const fillScheduleGaps = (groups) => {
  const dated = groups.filter((g) => g.date);
  if (dated.length < 2) return groups;
  const sorted = [...groups].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const out = [];
  sorted.forEach((g, i) => {
    out.push(g);
    const next = sorted[i + 1];
    // Заполняем «дни отдыха» только для разумных промежутков (<=10 дней). Большой разрыв —
    // признак битой/чужой даты, не рисуем недели пустых дней.
    const gapDays = g.date && next?.date ? Math.round((new Date(next.date) - new Date(g.date)) / 86400000) : 0;
    if (g.date && next?.date && gapDays > 1 && gapDays <= 10) {
      let cur = addDays(g.date, 1);
      let guard = 0;
      while (cur < next.date && guard < 10) {
        const d = new Date(`${cur}T12:00:00`);
        out.push({ mon: d.toLocaleDateString('en-US', { month: 'short' }), day: String(d.getDate()).padStart(2, '0'), date: cur, restDay: true, items: [] });
        cur = addDays(cur, 1);
        guard++;
      }
    }
  });
  return out;
};

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

// иконка дисциплины (как на странице Results)
const discIcon = (d = '') => {
  const s = d.toLowerCase();
  if (s.includes('rifle')) return '/img/Icon2.png';
  if (s.includes('pistol')) return '/img/Icon1.png';
  if (s.includes('moving') || s.includes('target')) return '/img/Icon3.png';
  if (s.includes('shotgun') || s.includes('trap') || s.includes('skeet')) return '/img/Icon4.png';
  return '/img/Icon1.png';
};

const SelectedEventPage = ({ slug }) => {
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [streams, setStreams] = useState([]);
  const [eventResults, setEventResults] = useState([]); // старые result-details (fallback)
  const [eventPhotos, setEventPhotos] = useState([]);
  const [resultDisc, setResultDisc] = useState(null);
  const [playing, setPlaying] = useState(null); // стрим во встроенном плеере
  const [animDone, setAnimDone] = useState(false); // мишень доиграла
  const router = useRouter();

  // При смене вкладки/события сбрасываем выбранную дисциплину в RESULTS
  useEffect(() => { setResultDisc(null); }, [activeTab, slug]);

  const tabs = ['OVERVIEW', 'DOCUMENTS', 'RESULTS', 'LIVE & MEDIA'];

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const evRes = await cachedGet(`${config.API_URL}/api/events?filters[slug][$eq]=${slug}&populate[image]=true&populate[schedule]=true&populate[documents][populate]=file`);
        if (evRes.data?.data?.length > 0) setEvent(evRes.data.data[0]);
      } catch (e) { console.error(e); }
    };
    fetchEvent();
  }, [slug]);

  useEffect(() => {
    const fetchExtra = async () => {
      // Результаты события грузим постранично — у крупных чемпионатов их > 1000 (все стадии/дисциплины).
      const fetchResults = async () => {
        let page = 1, all = [];
        while (page <= 10) {
          const res = await cachedGet(`${config.API_URL}/api/result-details?filters[eventSlug][$eq]=${slug}&sort=position:asc&pagination[pageSize]=1000&pagination[page]=${page}`).catch(() => null);
          const rows = res?.data?.data || [];
          all.push(...rows);
          const pc = res?.data?.meta?.pagination?.pageCount || 1;
          if (page >= pc) break;
          page++;
        }
        return all;
      };
      const [sRes, rAll, pRes] = await Promise.all([
        // LIVE & MEDIA — общий для всех событий (глобальные стримы/фото, как на Media)
        cachedGet(`${config.API_URL}/api/live-streams?populate[thumbnail]=true&pagination[pageSize]=10`).catch(() => ({ data: { data: [] } })),
        fetchResults(),
        cachedGet(`${config.API_URL}/api/photos?populate[image]=true&sort=date:desc&pagination[pageSize]=40`).catch(() => ({ data: { data: [] } })),
      ]);
      setStreams(sRes.data?.data || []);
      setEventResults(rAll || []);
      setEventPhotos(pRes.data?.data || []);
    };
    fetchExtra();
  }, [slug]);

  if (!event || !animDone) {
    return (
      <>
        <PageLoader variant="detail" />
        <TargetLoader onEnded={() => setAnimDone(true)} />
      </>
    );
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // Эффективный статус по датам — как на странице Events
  const getEffectiveStatus = () => {
    const start = event.date ? new Date(`${event.date}T00:00:00`) : null;
    if (!start || isNaN(start.getTime())) return (event.statusEvent || 'UPCOMING').toUpperCase() === 'FINISHED' ? 'FINISHED' : 'UPCOMING';
    const end = event.endDate ? new Date(`${event.endDate}T23:59:59`) : new Date(`${event.date}T23:59:59`);
    const now = new Date();
    if (now < start) return 'UPCOMING';
    if (now <= end) return 'ONGOING';
    return 'FINISHED';
  };
  const effStatus = getEffectiveStatus();
  // Числа участников/наций предварительны только пока событие не началось
  // (регистрация ещё идёт). Как только событие идёт — состав уже финальный.
  const isProvisional = effStatus === 'UPCOMING';
  const athletesText = (event.athletes && String(event.athletes).trim()) ? event.athletes : 'TBC';
  const nationsText = (event.nations && String(event.nations).trim()) ? event.nations : 'TBC';

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
    return Object.values(groups).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  };
  // Расписание из встроенного компонента event.schedule (реальные строки из PDF либо
  // по-дневная заглушка). Пропущенные дни заполняются «днём отдыха». Демо больше не используем.
  const scheduleRows = event?.schedule?.length ? event.schedule : [];
  // Отличаем РЕАЛЬНОЕ расписание (распарсено из PDF) от сгенерированной заглушки: у заглушки
  // первая строка — «Arrival & official training» / «Detailed programme available…» (эти строки
  // ставил только генератор). Такую не показываем — вместо неё «SCHEDULE NOT AVAILABLE».
  const isFallbackSchedule = scheduleRows.some((r) => /^\s*(arrival & official training|detailed programme available)/i.test(r.title || ''));
  // Часть заглушек = «программа есть в PDF, но не распарсена» — для них укажем на таб Documents.
  const hasProgrammePdf = scheduleRows.some((r) => /detailed programme available/i.test(r.title || ''));
  // Парсинг программ из PDF давал слишком много ошибок в таблице — по решению пользователя таблицу
  // ОТКЛЮЧАЕМ и везде показываем оригинальный PDF-документ (ветка scheduleDocs ниже), иначе — уведомление.
  // Флаг оставлен, чтобы при желании быстро вернуть табличный вид.
  const SHOW_PARSED_SCHEDULE = false;
  const displaySchedule = SHOW_PARSED_SCHEDULE && scheduleRows.length > 0 && !isFallbackSchedule ? fillScheduleGaps(groupSchedule(scheduleRows)) : [];

  // Официальные документы события. В табе DOCUMENTS показываем ВСЕ оригиналы целиком, НИЧЕГО не
  // убирая и не переделывая (result-book, программа, инфо — как на официальном сайте).
  // resultBookDocs / scheduleDocs — это лишь ДОПОЛНИТЕЛЬНЫЕ ссылки на те же самые оригиналы в
  // табах RESULTS / расписании; сами документы из Documents НЕ исчезают.
  const RESULT_RE = /result|ranklist|results book/i;
  const allDocs = (event?.documents || []).filter((d) => d.file);
  const resultBookDocs = allDocs.filter((d) => RESULT_RE.test(d.name || ''));
  const scheduleDocs = allDocs.filter((d) => /schedule|programme|program\b/i.test(d.name || ''));

  // Единый рендер строки файла (иконка типа, имя-ссылка, скачать, превью) — для DOCUMENTS,
  // Result-book в RESULTS и schedule-PDF в расписании.
  const docFileRow = (d, i) => {
    const url = d.file?.url ? (d.file.url.startsWith('http') ? d.file.url : `${config.API_URL}${d.file.url}`) : null;
    const ft = fileTypeMeta(d.file, d.name);
    const prevUrl = previewUrlFor(url, d.file, d.name);
    return (
      <div className="docs-file" key={i}>
        <i className={`fa-solid ${ft.icon} docs-file-icon`} style={{ color: ft.color }}></i>
        <div className="docs-file-info">
          {(prevUrl || url)
            ? <a className="docs-file-name docs-file-name-link" href={prevUrl || url} target="_blank" rel="noopener noreferrer">{d.name}</a>
            : <span className="docs-file-name">{d.name}</span>}
          <span className="docs-file-meta">{d.fileSize || '—'}</span>
        </div>
        <button className="docs-file-pdf" onClick={() => url && forceDownload(url, `${d.name || 'document'}${d.file?.ext || ''}`)} title="Download file">
          <i className="fa-solid fa-download"></i>{ft.label}
        </button>
        {prevUrl
          ? <button className="docs-file-view" onClick={() => window.open(prevUrl, '_blank')} title="Preview in browser"><i className="fa-solid fa-eye"></i></button>
          : <button className="docs-file-view docs-file-view-off" disabled title="No in-browser preview — use download"><i className="fa-solid fa-eye-slash"></i></button>}
      </div>
    );
  };

  // RESULTS этого события — группируем по КОНКРЕТНОЙ под-дисциплине (subDiscipline: стадия/событие),
  // иначе Qualification/Final/Standard/Junior сольются в одну таблицу. Внутри — сорт по месту + дедуп.
  const rPosKey = (r) => (r.position && r.position > 0 ? r.position : 9999);
  const rTotKey = (r) => parseFloat((String(r.total).match(/[\d.]+/) || [0])[0]) || 0;
  const resultGroups = (() => {
    const g = {};
    eventResults.forEach((r) => {
      const key = r.subDiscipline || `${r.discipline} — ${r.category}`;
      (g[key] = g[key] || []).push(r);
    });
    for (const k of Object.keys(g)) {
      const seen = new Set();
      g[k] = g[k]
        .sort((a, b) => (rPosKey(a) - rPosKey(b)) || (rTotKey(b) - rTotKey(a)))
        .filter((r) => { const n = (r.athleteName || '').trim().toLowerCase(); if (!n) return true; if (seen.has(n)) return false; seen.add(n); return true; });
    }
    return g;
  })();

  // Результаты показываем только для стартовавших событий (идёт/завершено) и только при наличии данных.
  // Для UPCOMING результатов быть не может, даже если в базе затесались строки.
  const hasResults = Object.keys(resultGroups).length > 0;
  const resultsAvailable = hasResults && (effStatus === 'FINISHED' || effStatus === 'ONGOING');

  const platformClass = (p) => ((p || '').toLowerCase() === 'facebook' ? 'facebook' : 'youtube');

  // WATCH: twitch убран.
  const liveStreams = streams.filter((s) => (s.platform || '').toLowerCase() !== 'twitch').slice(0, 3);
  const openStream = (s) => (canEmbed(s) ? setPlaying(s) : s.url && window.open(s.url, '_blank'));

  const liveStreamBlock = (
    <div className="sidebar-block live-stream-block">
      <div className="live-stream-header">
        <div className="live-stream-indicator">
          <span className="live-waves" aria-hidden="true"></span>
          <span className="live-stream-text">WATCH</span>
        </div>
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
                <span className="platform-stream">{s.title}</span>
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
          <span className="event-breadcrumb" onClick={() => router.push('/')}>HOME</span><span className="event-breadcrumb-sep">›</span>
          <span className="event-breadcrumb" onClick={() => router.push('/events')}>EVENTS</span><span className="event-breadcrumb-sep">›</span>
          <span className="event-breadcrumb-active">DETAIL</span>
        </div>
        <div className="event-status-row">
          <span className={`event-status-upcoming event-status-${effStatus.toLowerCase()}`}>{effStatus === 'ONGOING' ? 'IN PROGRESS' : effStatus}</span>
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
              <div className="event-info-item"><i className="fa-solid fa-users"></i><span>{athletesText} athletes · {nationsText} nations</span>{isProvisional && <span className="event-provisional" title="Numbers are provisional until registration closes">provisional</span>}</div>
            </div>
            <button className="event-entry-btn" onClick={() => window.open('https://esc-entry.eu', '_blank', 'noopener,noreferrer')}>
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
        <div className="event-content-wrapper">
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
                {displaySchedule.length > 0 ? (
                <div className="all-events-table">
                  <div className="ae-header">
                    <span>DATES</span><span>TIME</span><span>EVENT</span><span>STAGES</span>
                  </div>
                  {displaySchedule.map((g, gi) => (
                    <div className={`ae-group ${g.restDay ? 'ae-rest' : ''}`} key={gi}>
                      <div className="ae-date"><span className="ae-date-mon">{g.mon}</span><span className="ae-date-day">{g.day}</span></div>
                      <div className="ae-items">
                        {g.restDay ? (
                          <div className="ae-row ae-rest-row">
                            <span className="ae-rest-label"><i className="fa-regular fa-moon"></i> Rest day — no competition scheduled</span>
                          </div>
                        ) : g.items.map((it, ii) => (
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
                ) : scheduleDocs.length > 0 ? (
                  <div>
                    <p className="event-description">The detailed programme for this event is available as a PDF:</p>
                    <div className="docs-acc-files" style={{ marginTop: 4 }}>{scheduleDocs.map(docFileRow)}</div>
                  </div>
                ) : hasProgrammePdf ? (
                  <div className="stream-scheduled" style={{ maxWidth: 480, margin: '24px auto 8px' }}>
                    <i className="fa-regular fa-file-pdf stream-scheduled-icon"></i>
                    <span className="stream-scheduled-title">PROGRAMME IN DOCUMENTS</span>
                    <span className="stream-scheduled-text">The detailed programme for this event is available in the Documents tab.</span>
                  </div>
                ) : (
                  <div className="stream-scheduled" style={{ maxWidth: 480, margin: '24px auto 8px' }}>
                    <i className="fa-regular fa-calendar-xmark stream-scheduled-icon"></i>
                    <span className="stream-scheduled-title">SCHEDULE NOT AVAILABLE</span>
                    <span className="stream-scheduled-text">No schedule has been published for this event yet.</span>
                  </div>
                )}
              </>
            )}

            {activeTab === 'DOCUMENTS' && (
              (allDocs.length > 0) ? (
                <div className="docs-acc-files" style={{ marginTop: 4 }}>
                  {allDocs.map(docFileRow)}
                </div>
              ) : (
                <div className="stream-scheduled" style={{ maxWidth: 480, margin: '40px auto' }}>
                  <i className="fa-regular fa-clock stream-scheduled-icon"></i>
                  <span className="stream-scheduled-title">NO DOCUMENTS</span>
                  <span className="stream-scheduled-text">No documents are available for this event.</span>
                </div>
              )
            )}

            {activeTab === 'RESULTS' && (
              <>
                <h2 className="event-section-title">RESULTS</h2>
                {resultsAvailable ? (
                  <>
                    {!resultDisc ? (
                      <>
                        <p className="event-description">Select a discipline to view official results for {event.name}.</p>
                        <div className="se-disc-grid">
                          {Object.entries(resultGroups).map(([disc, rows]) => {
                            const parts = disc.split(' — ');
                            const mainDisc = parts[0];
                            const stage = parts.slice(1).join(' — ');
                            return (
                              <div className="se-disc-card" key={disc} onClick={() => setResultDisc(disc)}>
                                <h3 className="se-disc-title"><span className="se-disc-main">{mainDisc}</span><span className="se-disc-sub">{stage ? `${stage} · ` : ''}{rows.length} athletes</span></h3>
                                <div className="se-disc-icon"><img src={discIcon(mainDisc)} alt="" /></div>
                                <span className="se-disc-arrow">›</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="se-results-breadcrumb">
                          <span className="se-bc-link" onClick={() => setResultDisc(null)}>Results</span>
                          <span className="se-bc-sep">›</span>
                          <span className="se-bc-active">{resultDisc}</span>
                        </div>
                        <div className="event-result-block">
                          <div className="event-result-table">
                            <div className="er-head"><span>RANK</span><span>ATHLETE</span><span>FED</span><span>TOTAL</span><span>INNER 10s</span></div>
                            {resultGroups[resultDisc].map((r, i) => (
                              <div className={`er-row ${i < 3 ? 'er-medal er-medal-' + (i + 1) : ''}`} key={r.id || i}>
                                <span className="er-rank">{i + 1}</span>
                                <span className="er-name">{r.athleteName}</span>
                                <span className="er-fed">{r.federationCode}</span>
                                <span className="er-total">{r.total}</span>
                                <span className="er-inner">{r.inner10s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {/* Официальный result-book PDF — под нашей таблицей, если он есть. */}
                    {resultBookDocs.length > 0 && (
                      <div style={{ marginTop: 26 }}>
                        <h3 className="event-subtitle">Official result book (PDF)</h3>
                        <div className="docs-acc-files" style={{ marginTop: 4 }}>{resultBookDocs.map(docFileRow)}</div>
                      </div>
                    )}
                  </>
                ) : resultBookDocs.length > 0 ? (
                  <>
                    <p className="event-description">Official result book{resultBookDocs.length > 1 ? 's' : ''} for {event.name}.</p>
                    <div className="docs-acc-files" style={{ marginTop: 4 }}>{resultBookDocs.map(docFileRow)}</div>
                  </>
                ) : (
                  <div className="stream-scheduled" style={{ maxWidth: 480, margin: '40px auto' }}>
                    <i className="fa-regular fa-clock stream-scheduled-icon"></i>
                    <span className="stream-scheduled-title">RESULTS PENDING</span>
                    <span className="stream-scheduled-text">{effStatus === 'UPCOMING'
                      ? 'Results will be published here once the competition begins.'
                      : 'Official results will appear here once the competition is complete.'}</span>
                  </div>
                )}
                <button className="event-tab-cta" onClick={() => router.push('/results')}>FULL RESULTS &amp; RANKINGS ›</button>
              </>
            )}

            {activeTab === 'LIVE & MEDIA' && (
              <>
                <h2 className="event-section-title">LIVE &amp; MEDIA</h2>
                <p className="event-description">Live streams, highlights and media coverage.</p>
                {liveStreams.length > 0 ? (
                  <div className="event-media-streams">
                    {liveStreams.map((s) => {
                      // превью: своё залитое, иначе стоп-кадр самого стрима (YouTube)
                      const cover = getImageUrl(s.thumbnail) || ytThumb(s.url);
                      return (
                      <div key={s.id} className={`event-media-card ${platformClass(s.platform)}-card`} style={cover ? { backgroundImage: `url(${cover})` } : undefined} onClick={() => openStream(s)}>
                        {!cover && (
                          <div className="event-media-fallback" aria-hidden="true">
                            <i className={`fa-brands fa-${platformClass(s.platform)}`}></i>
                          </div>
                        )}
                        <div className="event-media-overlay"></div>
                        <div className="event-media-badge">
                          <i className={`fa-brands fa-${platformClass(s.platform)}`}></i>
                          <span>{platformClass(s.platform).toUpperCase()}</span>
                        </div>
                        <div className="event-media-play"><i className="fa-solid fa-play"></i></div>
                        <div className="event-media-info">
                          <span className="event-media-title">{s.title}</span>
                          <span className="event-media-meta">
                            Goes live at event start
                          </span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="stream-scheduled" style={{ maxWidth: 480, margin: '40px auto' }}>
                    <i className="fa-regular fa-circle-play stream-scheduled-icon"></i>
                    <span className="stream-scheduled-title">STREAM SCHEDULED</span>
                    <span className="stream-scheduled-text">Goes live when the event begins. Available on YouTube &amp; Facebook.</span>
                  </div>
                )}

                {eventPhotos.length > 0 && (
                  <>
                    <h3 className="event-subtitle" style={{ marginTop: 28 }}>PHOTO GALLERY</h3>
                    <div className="event-photo-grid">
                      {eventPhotos.map((p) => (
                        <div key={p.id} className="event-photo-card" style={{ backgroundImage: `url(${getImageUrl(p.image)})` }} onClick={() => p.slug && router.push(`/media/photo/${p.slug}`)}>
                          <div className="event-photo-overlay"></div>
                          <div className="event-photo-info">
                            <span className="event-photo-title">{p.title}</span>
                            <span className="event-photo-count"><i className="fa-regular fa-images"></i> {Array.isArray(p.images) ? p.images.length : (p.photoCount || 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <button className="event-tab-cta" onClick={() => router.push('/media')}>GO TO MEDIA &amp; NEWS ›</button>
              </>
            )}
          </div>

          {/* SIDEBAR — на всех вкладках, включая DOCUMENTS (панель EVENT DETAILS не должна пропадать). */}
          <aside className="event-sidebar">
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">EVENT DETAILS</h4>
              <div className="sidebar-divider"></div>
              <div className="event-detail-list">
                <div className="detail-item"><i className="fa-regular fa-calendar detail-icon"></i><div className="detail-content"><span className="detail-label">DATES</span><span className="detail-value">{formatDate(event.date)} - {formatDate(event.endDate)}</span></div></div>
                <div className="sidebar-divider"></div>
                <div className="detail-item"><i className="fa-solid fa-location-dot detail-icon"></i><div className="detail-content"><span className="detail-label">LOCATION</span><span className="detail-value">{event.location}</span></div></div>
                <div className="sidebar-divider"></div>
                <div className="detail-item"><i className="fa-solid fa-user-group detail-icon"></i><div className="detail-content"><span className="detail-label">NATIONS{isProvisional && <span className="detail-provisional"> · provisional</span>}</span><span className="detail-value">{nationsText}</span></div></div>
                <div className="sidebar-divider"></div>
                <div className="detail-item"><i className="fa-solid fa-user-group detail-icon"></i><div className="detail-content"><span className="detail-label">ATHLETES{isProvisional && <span className="detail-provisional"> · provisional</span>}</span><span className="detail-value">{athletesText}</span></div></div>
              </div>
            </div>

            <div className="sidebar-block">
              <h4 className="sidebar-block-title">QUICK ACTIONS</h4>
              <div className="sidebar-divider"></div>
              <div className="quick-actions-list">
                <button className="quick-action-btn" onClick={() => window.open('https://esc-entry.eu', '_blank', 'noopener,noreferrer')}><i className="fa-solid fa-arrow-up-right-from-square"></i><span>ENTRY SYSTEM</span></button>
                <div className="sidebar-divider"></div>
                <button className="quick-action-btn" onClick={() => setActiveTab('DOCUMENTS')}><i className="fa-solid fa-download"></i><span>TECHNICAL PACKAGE</span></button>
                <div className="sidebar-divider"></div>
                {resultsAvailable ? (
                  <button className="quick-action-btn" onClick={() => setActiveTab('RESULTS')}><i className="fa-solid fa-trophy"></i><span>VIEW RESULTS</span></button>
                ) : (
                  <button className="quick-action-btn quick-action-disabled" disabled title={effStatus === 'FINISHED' ? 'Results are being processed' : 'Results become available after the event'}>
                    <i className="fa-regular fa-clock"></i><span>{effStatus === 'FINISHED' ? 'RESULTS PENDING' : 'RESULTS AFTER EVENT'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="sidebar-block">
              <h4 className="sidebar-block-title">CONTACT</h4>
              <div className="sidebar-divider"></div>
              <div className="contact-item-sidebar"><i className="fa-regular fa-envelope"></i><a href="mailto:technical@esc-shooting.eu">technical@esc-shooting.eu</a></div>
            </div>

            {liveStreamBlock}
          </aside>
        </div>
      </section>

      <StreamPlayer stream={playing} onClose={() => setPlaying(null)} />
    </>
  );
};

export default SelectedEventPage;
