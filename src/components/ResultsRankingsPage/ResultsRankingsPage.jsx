'use client';
import { useState, useEffect, useMemo } from 'react';
import { cachedGet } from '@/lib/apiCache';
import config from '@/lib/config';
import LoadingResults from '@/components/LoadingResults/LoadingResults';
import SkeletonEvents from '@/components/LoadingResults/SkeletonEvents';
import Pagination from '@/components/Pagination/Pagination';
import DateFilter from '@/components/DateFilter/DateFilter';
import { downloadFile as forceDownload } from '@/lib/download';
import './ResultsRankingsPage.css';

// Тестовые соревнования (fallback, если в Strapi пусто) — чтобы флоу Results работал целиком
const TEST_EVENTS = [
  { id: 'te1', name: 'European Championship 10m 2026', location: 'Prague, Czech Republic', date: '2026-05-18', statusEvent: 'FINISHED', category: 'SENIOR', type: 'CHAMPIONSHIP' },
  { id: 'te2', name: 'ESC Grand Prix Munich 2026', location: 'Munich, Germany', date: '2026-06-12', statusEvent: 'UPCOMING', category: 'SENIOR', type: 'CHAMPIONSHIP' },
  { id: 'te3', name: 'European Youth League Final', location: 'Bologna, Italy', date: '2026-04-05', statusEvent: 'FINISHED', category: 'JUNIOR', type: 'CHAMPIONSHIP' },
  { id: 'te4', name: 'ESC Development Workshop Lausanne', location: 'Lausanne, Switzerland', date: '2026-03-15', statusEvent: 'FINISHED', category: 'SENIOR', type: 'WORKSHOP' },
  { id: 'te5', name: 'Nordic Shooting Cup Oslo', location: 'Oslo, Norway', date: '2026-07-20', statusEvent: 'UPCOMING', category: 'SENIOR', type: 'CHAMPIONSHIP' },
  { id: 'te6', name: 'ESC Air Rifle Grand Prix Vienna', location: 'Vienna, Austria', date: '2026-02-10', statusEvent: 'FINISHED', category: 'SENIOR', type: 'CHAMPIONSHIP' },
];

// Дисциплины для RANKINGS — с разбивкой по полу (порядок = 3 колонки по макету)
const IC_PISTOL = '/img/Icon1.png';
const IC_RIFLE = '/img/Icon2.png';
const IC_SHOTGUN = '/img/Icon4.png';
const RANKING_DISCIPLINES = [
  { main: '10M PISTOL', sub: 'MEN', discipline: '10m Air Pistol', gender: 'MEN', icon: IC_PISTOL },
  { main: '25M RAPID FIRE', sub: 'PISTOL', discipline: '25m Rapid Fire Pistol', gender: 'MEN', icon: IC_PISTOL },
  { main: 'TRAP MEN', sub: '', discipline: 'Trap', gender: 'MEN', icon: IC_SHOTGUN },
  { main: '10M PISTOL', sub: 'WOMEN', discipline: '10m Air Pistol', gender: 'WOMEN', icon: IC_PISTOL },
  { main: '25M PISTOL', sub: 'WOMEN', discipline: '25m Pistol', gender: 'WOMEN', icon: IC_PISTOL },
  { main: 'TRAP WOMEN', sub: '', discipline: 'Trap', gender: 'WOMEN', icon: IC_SHOTGUN },
  { main: '10M RIFLE', sub: 'MEN', discipline: '10m Air Rifle', gender: 'MEN', icon: IC_RIFLE },
  { main: '50M RIFLE 3 POSITION', sub: 'MEN', discipline: '50m Rifle 3 Position', gender: 'MEN', icon: IC_RIFLE },
  { main: 'SKEET MEN', sub: '', discipline: 'Skeet', gender: 'MEN', icon: IC_SHOTGUN },
  { main: '10M RIFLE', sub: 'WOMEN', discipline: '10m Air Rifle', gender: 'WOMEN', icon: IC_RIFLE },
  { main: '50M RIFLE 3 POSITION', sub: 'WOMEN', discipline: '50m Rifle 3 Position', gender: 'WOMEN', icon: IC_RIFLE },
  { main: 'SKEET WOMEN', sub: '', discipline: 'Skeet', gender: 'WOMEN', icon: IC_SHOTGUN },
];

// --- Сопоставление событий с официальными result-book PDF ---
// Для событий, которых нет в SIUS (структурно), показываем PDF-результаты с офиц. сайта
// (документы уже зеркалированы в коллекцию docs). Матч по названию+году, дата документа = дата
// публикации (не события), поэтому по дате не матчим.
const RESULT_RE = /result|ranklist|results book/i;

// eventSlug -> массив result-book вложений [{name, file, fileSize}] из event.documents (без угадывания).
function buildEventResultMap(events) {
  const map = {};
  for (const e of events) {
    if (!e.slug || !Array.isArray(e.documents)) continue;
    const rb = e.documents.filter((d) => RESULT_RE.test(d.name || '') && d.file);
    if (rb.length) map[e.slug] = rb.map((d) => ({ name: d.name, file: d.file, fileSize: d.fileSize }));
  }
  return map;
}

const PER_PAGE = 10;

// Обёртка над общей пагинацией (принимает total → считает pageCount)
const Pager = ({ page, setPage, total, perPage = PER_PAGE }) => (
  <Pagination page={page} pageCount={Math.ceil(total / perPage)} onChange={setPage} />
);

const ResultsRankingsPage = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState('results');
  const [events, setEvents] = useState([]);
  const [docs, setDocs] = useState([]); // документы (для result-book PDF по событиям без SIUS)
  const [disciplineLevel, setDisciplineLevel] = useState(false);
  const [resultsLevel, setResultsLevel] = useState(false);
  const [pdfLevel, setPdfLevel] = useState(false); // просмотр PDF-результатов события без структурных данных
  const [pdfFiles, setPdfFiles] = useState([]); // вложения-результаты для PDF-просмотра (событие или архив)
  const [rankingsDetailLevel, setRankingsDetailLevel] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState('10m Air Pistol');
  const [selectedSubDiscipline, setSelectedSubDiscipline] = useState(''); // конкретная под-дисциплина (напр. "50m Rifle 3 Positions")
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventSlug, setSelectedEventSlug] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('World Records');
  const [rankings, setRankings] = useState([]);
  const [resultDetails, setResultDetails] = useState([]);
  const [records, setRecords] = useState([]);
  const [gender, setGender] = useState('ALL');
  const [rankingsGender, setRankingsGender] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterType, setFilterType] = useState('ALL TYPES');
  const [filterStatus, setFilterStatus] = useState('ALL STATUSES');
  const [sortDir, setSortDir] = useState('desc'); // desc = сначала новые
  const [rankingsSearchTerm, setRankingsSearchTerm] = useState('');
  const [resultsPage, setResultsPage] = useState(1);
  const [rankingsPage, setRankingsPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false); // короткая загрузка при входе на таблицу (3 уровень)

  useEffect(() => {
    const fetchData = async () => {
      // Strapi ограничивает pageSize (макс 100). Records/rankings/results > 100 строк,
      // поэтому листаем страницы, иначе часть дисциплин выпадает и показываются TEST-данные.
      const fetchAll = async (path) => {
        let page = 1, all = [];
        while (page <= 15) {
          const res = await cachedGet(`${config.API_URL}${path}&pagination[pageSize]=100&pagination[page]=${page}`);
          all.push(...(res.data?.data || []));
          const pc = res.data?.meta?.pagination?.pageCount || 1;
          if (page >= pc) break;
          page++;
        }
        return all;
      };
      try {
        // allSettled: падение одного запроса (напр. 403) не должно обнулять остальные секции
        const [eventsRes, rankingsRes, resultsRes, recordsRes, docsRes] = await Promise.allSettled([
          fetchAll(`/api/events?sort=date:desc&populate[documents][populate]=file`),
          fetchAll(`/api/ranking-details?populate=*&sort=position:asc`),
          fetchAll(`/api/result-details?populate=*&sort=position:asc`),
          fetchAll(`/api/records?populate=*&sort=date:desc`),
          fetchAll(`/api/docs?filters[title][$contains]=Historical&populate[attachments][populate]=file`),
        ]);
        if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value);
        if (rankingsRes.status === 'fulfilled') setRankings(rankingsRes.value);
        if (resultsRes.status === 'fulfilled') setResultDetails(resultsRes.value);
        if (recordsRes.status === 'fulfilled') setRecords(recordsRes.value);
        if (docsRes.status === 'fulfilled') setDocs(docsRes.value);
        [eventsRes, rankingsRes, resultsRes, recordsRes, docsRes]
          .filter((r) => r.status === 'rejected')
          .forEach((r) => console.error('Ошибка загрузки раздела:', r.reason?.message || r.reason));
      } catch (e) { console.error('Ошибка загрузки:', e); }
      finally { setLoaded(true); }
    };
    fetchData();
  }, []);

  // Загрузка при входе на 3 уровень (таблица): показываем анимацию-мишень.
  // Скрываем по onEnded видео (доигрывает до конца); таймаут — только страховка, если видео не догрузилось.
  useEffect(() => {
    if (!resultsLevel && !rankingsDetailLevel) return;
    setDetailLoading(true);
    const t = setTimeout(() => setDetailLoading(false), 8000);
    return () => clearTimeout(t);
  }, [resultsLevel, rankingsDetailLevel, selectedDiscipline, activeTab]);

  const tabs = ['results', 'ranking', 'records'];
  const months = [
    { value: '0', label: 'JAN' }, { value: '1', label: 'FEB' }, { value: '2', label: 'MAR' },
    { value: '3', label: 'APR' }, { value: '4', label: 'MAY' }, { value: '5', label: 'JUN' },
    { value: '6', label: 'JUL' }, { value: '7', label: 'AUG' }, { value: '8', label: 'SEP' },
    { value: '9', label: 'OCT' }, { value: '10', label: 'NOV' }, { value: '11', label: 'DEC' },
  ];
  const years = ['all', ...Array.from(new Set(
    events.map((e) => { const d = new Date(e.date); return isNaN(d.getTime()) ? null : d.getFullYear(); }).filter((y) => y && y > 1971)
  )).sort((a, b) => b - a)].map(String);
  const types = ['ALL TYPES', 'COMPETITION', 'EDUCATION', 'MEETING'];
  const statuses = ['ALL STATUSES', 'UPCOMING', 'COMPLETED'];

  const disciplines = [
    { main: '10M', sub: 'AIR PISTOL', id: '10m-air-pistol', icon: '/img/Icon1.png' },
    { main: '10M', sub: 'AIR RIFLE', id: '10m-air-rifle', icon: '/img/Icon2.png' },
    { main: '25M', sub: 'PISTOL', id: '25m-pistol', icon: '/img/Icon1.png' },
    { main: '50M', sub: 'RIFLE', id: '50m-rifle', icon: '/img/Icon2.png' },
    { main: 'MOVING', sub: 'TARGET', id: 'moving-target', icon: '/img/Icon3.png' },
    { main: 'SHOTGUN', sub: '', id: 'shotgun', icon: '/img/Icon4.png' },
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
    setPdfLevel(false);
    setSelectedEventSlug('');
  };

  // Статус события по датам (как на странице Events): UPCOMING / ONGOING / FINISHED.
  // Не полагаемся на ручное поле statusEvent, чтобы статус не устаревал.
  const evStatus = (ev) => {
    const start = ev?.date ? new Date(`${ev.date}T00:00:00`) : null;
    if (!start || isNaN(start.getTime())) return (ev?.statusEvent || 'UPCOMING').toUpperCase() === 'FINISHED' ? 'FINISHED' : 'UPCOMING';
    const end = ev?.endDate ? new Date(`${ev.endDate}T23:59:59`) : new Date(`${ev.date}T23:59:59`);
    const now = new Date();
    if (now < start) return 'UPCOMING';
    if (now <= end) return 'ONGOING';
    return 'FINISHED';
  };

  // Результаты привязаны к выбранному событию (eventSlug), затем по дисциплине/полу
  const eventDisciplineResults = resultDetails.filter(r => {
    const matchEvent = !selectedEventSlug || r.eventSlug === selectedEventSlug;
    const matchDiscipline = r.discipline?.toLowerCase() === selectedDiscipline.toLowerCase();
    const matchGender = gender === 'ALL' || r.category?.toUpperCase() === gender;
    return matchEvent && matchDiscipline && matchGender;
  });
  // Под-дисциплины внутри выбранной грубой дисциплины (напр. 3 Positions / Prone / 300m).
  // Разные соревнования нельзя мешать в одну таблицу — показываем селектором.
  const subDisciplines = Array.from(new Set(eventDisciplineResults.map((r) => r.subDiscipline).filter(Boolean)));
  const activeSub = selectedSubDiscipline && subDisciplines.includes(selectedSubDiscipline)
    ? selectedSubDiscipline
    : (subDisciplines[0] || '');
  const filteredResults = eventDisciplineResults
    .filter((r) => !activeSub || (r.subDiscipline || '') === activeSub)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // Только реальные данные: если для дисциплины/пола результатов нет — покажем пустое состояние
  const displayResults = filteredResults;

  // Прогресс выстрелов — по числу сделанных выстрелов у лидера
  const totalShots = 24;
  const leaderShots = Array.isArray(displayResults[0]?.shots)
    ? displayResults[0].shots.filter((s) => s && s !== '•' && s !== '-').length
    : 0;
  const currentShot = leaderShots;
  const shotSeries = ['S1', 'S2', 'S3', 'S4'];

  const filteredRankings = rankings.filter(r => {
    const matchDiscipline = r.discipline && r.discipline.toLowerCase() === selectedDiscipline.toLowerCase();
    const matchGender = rankingsGender === 'ALL' || r.category?.toUpperCase() === rankingsGender;
    const matchSearch = !rankingsSearchTerm || r.athleteName?.toLowerCase().includes(rankingsSearchTerm.toLowerCase());
    return matchDiscipline && matchGender && matchSearch;
  });

  const displayRankings = filteredRankings;

  // Рекорды: реальные по дисциплине/полу, иначе тестовые
  const filteredRecords = records.filter((r) => {
    const disciplineMatch = r.discipline?.trim().toLowerCase() === selectedDiscipline?.trim().toLowerCase();
    const genderMatch = gender === 'ALL' || r.category?.trim().toUpperCase() === gender;
    return disciplineMatch && genderMatch;
  });
  const displayRecords = filteredRecords;

  // Пагинация по 10 на страницу
  const pagedResults = displayResults.slice((resultsPage - 1) * PER_PAGE, resultsPage * PER_PAGE);
  const pagedRankings = displayRankings.slice((rankingsPage - 1) * PER_PAGE, rankingsPage * PER_PAGE);
  const pagedRecords = displayRecords.slice((recordsPage - 1) * PER_PAGE, recordsPage * PER_PAGE);

  // Сброс на первую страницу при смене фильтров
  useEffect(() => { setResultsPage(1); }, [selectedDiscipline, selectedSubDiscipline, gender, selectedEvent, resultDetails.length]);
  useEffect(() => { setRankingsPage(1); }, [selectedDiscipline, rankingsGender, rankingsSearchTerm, rankings.length]);
  useEffect(() => { setRecordsPage(1); }, [selectedDiscipline, gender, records.length]);

  // Показываем только события, у которых реально есть результаты (как на офиц. сайте):
  // либо структурные (SIUS), либо official result-book PDF. Иначе среди 800+ событий
  // календаря пользователь кликает пустые.
  const structuredSlugs = useMemo(() => new Set(resultDetails.map((r) => r.eventSlug).filter(Boolean)), [resultDetails]);
  const eventResultPdfs = useMemo(() => buildEventResultMap(events), [events]);
  const historicalArchive = useMemo(() => {
    const d = docs.find((x) => /historical results|1955/i.test(x.title || ''));
    return d ? { title: d.title, files: (d.attachments || []).filter((a) => a.file) } : null;
  }, [docs]);
  const hasStructured = (slug) => structuredSlugs.has(slug);
  const eventsWithResults = events.filter((e) => structuredSlugs.has(e.slug) || eventResultPdfs[e.slug]);
  const eventsSource = events.length > 0 ? eventsWithResults : (loaded ? TEST_EVENTS : []);

  // Открыть PDF-просмотр (событие без структуры или исторический архив)
  const openPdfView = (title, files) => { setSelectedEvent(title); setPdfFiles(files || []); setPdfLevel(true); };
  const fileUrl = (file) => (file?.url ? (file.url.startsWith('http') ? file.url : `${config.API_URL}${file.url}`) : null);
  const previewFile = (file) => { const u = fileUrl(file); if (u) window.open(u, '_blank'); };
  const downloadResultFile = (name, file) => { const u = fileUrl(file); if (u) forceDownload(u, `${name || 'result'}${file?.ext || ''}`); };
  const filteredEvents = eventsSource.filter(ev => {
    const eventDate = new Date(ev.date);
    const matchType = filterType === 'ALL TYPES' || ev.type?.toUpperCase() === filterType;
    const evSt = evStatus(ev);
    const matchStatus = filterStatus === 'ALL STATUSES' ||
      (filterStatus === 'UPCOMING' && evSt !== 'FINISHED') ||
      (filterStatus === 'COMPLETED' && evSt === 'FINISHED');
    const matchMonth = filterMonth === 'all' || eventDate.getMonth() === parseInt(filterMonth);
    const matchYear = filterYear === 'all' || eventDate.getFullYear() === parseInt(filterYear);
    return matchType && matchStatus && matchMonth && matchYear;
  });
  // Сортировка по дате с видимым направлением
  const sortedEvents = [...filteredEvents].sort((a, b) =>
    sortDir === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
  );
  const eventFiltersActive = filterMonth !== 'all' || filterYear !== 'all' || filterType !== 'ALL TYPES' || filterStatus !== 'ALL STATUSES';
  const resetEventFilters = () => { setFilterMonth('all'); setFilterYear('all'); setFilterType('ALL TYPES'); setFilterStatus('ALL STATUSES'); };

  const getShotClass = (val) => {
    if (val === '-' || val === '•' || !val) return 'shot-miss';
    const num = parseFloat(val);
    if (isNaN(num)) return 'shot-miss'; // «—», «–» и прочие маркеры-заглушки
    if (num >= 10.8) return 'shot-high';
    if (num >= 10.3) return 'shot-mid';
    return 'shot-low';
  };

  const handleExportPDF = () => {
    if (typeof window !== 'undefined') window.print();
  };


  // Общий фильтр-бар для RANKINGS (оба уровня)
  const rankingDisciplineOptions = [...new Set(RANKING_DISCIPLINES.map(d => `${d.main} ${d.sub}`.trim()))];
  const rankingsFilterBar = (
    <div className="rankings-filter-bar">
      <div className="rankings-filter-left">
        <div className="rankings-search">
          <i className="fa-solid fa-magnifying-glass rankings-search-icon"></i>
          <input
            type="text"
            className="rankings-search-input"
            placeholder="Search athlete or event..."
            value={rankingsSearchTerm}
            onChange={(e) => setRankingsSearchTerm(e.target.value)}
          />
        </div>
        <select className="events-select" value="" onChange={(e) => {
          const d = RANKING_DISCIPLINES.find((x) => `${x.main} ${x.sub}`.trim() === e.target.value);
          if (d) { setSelectedDiscipline(d.discipline); setRankingsGender(d.gender); setGender(d.gender); setRankingsDetailLevel(true); }
        }}>
          <option value="">Discipline</option>
          {rankingDisciplineOptions.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className="events-select" value={rankingsGender} onChange={(e) => setRankingsGender(e.target.value)}>
          <option value="ALL">Gender</option>
          <option value="MEN">Men</option>
          <option value="WOMEN">Women</option>
        </select>
      </div>
      <button className="export-btn" onClick={handleExportPDF}><i className="fa-solid fa-download"></i>EXPORT PDF</button>
    </div>
  );

  return (
    <>
      {/* HERO */}
      {!embedded && (
      <section className="results-hero">
        <div className="results-breadcrumbs"><span className="breadcrumb-home">HOME</span><span className="breadcrumb-separator">›</span><span className="breadcrumb-active">RESULTS & RANKINGS</span></div>
        <div className="results-subtitle-row"><span className="results-line"></span><span className="results-subtitle">SPORTS DATA HUB</span></div>
        <h1 className="results-title">RESULTS & RANKINGS</h1>
        <div className="results-divider"></div>
        <div className="results-filters">
          {tabs.map((t) => <button key={t} className={`filter-btn ${activeTab === t ? 'active' : ''}`} onClick={() => switchTab(t)}>{t.toUpperCase()}</button>)}
        </div>
      </section>
      )}

      {/* RESULTS TAB - Level 1 */}
      {activeTab === 'results' && !disciplineLevel && !resultsLevel && !pdfLevel && (
        <section className="results-events">
          {!loaded ? <SkeletonEvents /> : (<>
          <div className="events-filter-bar">
            <div className="events-filter-left">
              <DateFilter
                month={filterMonth}
                year={filterYear}
                onMonth={setFilterMonth}
                onYear={setFilterYear}
                months={months}
                years={years.filter((y) => y !== 'all')}
              />
              <select className="events-select events-select-md" value={filterType} onChange={(e) => setFilterType(e.target.value)}>{types.map((t) => <option key={t}>{t}</option>)}</select>
              <select className="events-select events-select-md" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
              <button className="events-sort-btn" onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))} title="Change sort direction">
                <i className={`fa-solid ${sortDir === 'desc' ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-short-wide'}`}></i>
                {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
            <div className="events-filter-right"><span className="events-count-num">{sortedEvents.length}</span><span className="events-count-label">competitions</span></div>
          </div>
          <div className="events-list">
            {/* Сводный исторический архив результатов (PDF, как на офиц. сайте) */}
            {historicalArchive && !eventFiltersActive && (
              <div className="event-card event-completed" onClick={() => openPdfView(historicalArchive.title, historicalArchive.files)} style={{ cursor: 'pointer' }}>
                <div className="event-card-left">
                  <div className="event-tags">
                    <span className="event-status status-completed">ARCHIVE</span>
                    <span className="event-category">1955–2023</span>
                  </div>
                  <h3 className="event-card-title">{historicalArchive.title}</h3>
                  <div className="event-card-meta">
                    <span className="event-meta-item"><i className="fa-regular fa-folder-open"></i>{historicalArchive.files.length} result books (PDF)</span>
                  </div>
                </div>
                <div className="event-card-right">
                  <button className="event-view-btn"><i className="fa-regular fa-file-pdf" style={{ marginRight: 6 }}></i>OPEN</button>
                </div>
              </div>
            )}
            {sortedEvents.length > 0 ? sortedEvents.map((ev) => {
              const evSt = evStatus(ev);
              const isUpcoming = evSt !== 'FINISHED';
              return (
              <div key={ev.id} className={`event-card ${isUpcoming ? 'event-upcoming' : 'event-completed'}`}
                onClick={isUpcoming ? undefined : () => {
                  setSelectedEvent(ev.name);
                  setSelectedEventSlug(ev.slug || `__ev-${ev.id}__`);
                  // Есть структура (SIUS) → выбор дисциплины и таблицы; иначе → PDF-результаты
                  if (hasStructured(ev.slug)) setDisciplineLevel(true);
                  else openPdfView(ev.name, eventResultPdfs[ev.slug] || []);
                }}
                style={{ cursor: isUpcoming ? 'default' : 'pointer' }}>
                <div className="event-card-left">
                  <div className="event-tags">
                    <span className={`event-status ${isUpcoming ? 'status-upcoming' : 'status-completed'}`}>{evSt}</span>
                    <span className="event-category">{ev.category || 'SENIOR'}</span>
                    <span className="event-year">{new Date(ev.date).getFullYear()}</span>
                  </div>
                  <h3 className="event-card-title">{ev.name}</h3>
                  <div className="event-card-meta">
                    <span className="event-meta-item"><i className="fa-solid fa-location-dot"></i>{ev.location}</span>
                    <span className="event-meta-item"><i className="fa-regular fa-calendar"></i>{formatDate(ev.date)}</span>
                  </div>
                </div>
                <div className="event-card-right">
                  {isUpcoming
                    ? <span className="event-view-btn event-view-pending"><i className="fa-regular fa-clock"></i>RESULTS PENDING</span>
                    : <button className="event-view-btn">{hasStructured(ev.slug) ? 'VIEW >' : <><i className="fa-regular fa-file-pdf" style={{ marginRight: 6 }}></i>VIEW PDF</>}</button>}
                </div>
              </div>
              );
            }) : (
              <div className="events-empty">
                <i className="fa-regular fa-calendar-xmark events-empty-icon"></i>
                <p className="events-empty-title">No competitions found</p>
                <p className="events-empty-text">{eventFiltersActive ? 'Nothing matches the selected filters.' : 'No competitions to show yet.'}</p>
                {eventFiltersActive && <button className="events-empty-btn" onClick={resetEventFilters}>Clear filters</button>}
              </div>
            )}
          </div>
          </>)}
        </section>
      )}

      {/* RESULTS - PDF archive view (события без структурных данных / исторический архив) */}
      {activeTab === 'results' && pdfLevel && (
        <section className="results-detail">
          <div className="results-detail-header"><span className="results-detail-line"></span><span className="results-detail-subtitle">ESC RESULTS</span></div>
          <h2 className="results-detail-title">{selectedEvent}</h2>
          <div className="results-detail-topbar">
            <div className="results-detail-breadcrumbs">
              <span className="rd-breadcrumb" onClick={() => { setPdfLevel(false); setPdfFiles([]); }}>Results</span>
              <span className="rd-breadcrumb-sep">›</span>
              <span className="rd-breadcrumb-active">{selectedEvent}</span>
            </div>
          </div>
          {pdfFiles.length > 0 ? (
            <div className="results-archive-list">
              {pdfFiles.map((f, i) => (
                <div className="results-archive-item" key={i}>
                  <i className="fa-regular fa-file-pdf results-archive-icon"></i>
                  <div className="results-archive-info">
                    <span className="results-archive-name">{f.name}</span>
                    <span className="results-archive-meta">{f.fileSize || 'PDF'}</span>
                  </div>
                  <button className="results-archive-btn" onClick={() => previewFile(f.file)} title="Open in browser"><i className="fa-solid fa-eye"></i> Preview</button>
                  <button className="results-archive-btn results-archive-btn-dl" onClick={() => downloadResultFile(f.name, f.file)} title="Download"><i className="fa-solid fa-download"></i> PDF</button>
                </div>
              ))}
              <div className="data-source-bar" style={{ marginTop: 20 }}>
                <div className="data-source-left">
                  <span className="source-label">Data source:</span>
                  <span className="source-text">Official ESC PDF archive</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="results-empty">
              <i className="fa-regular fa-clock results-empty-icon"></i>
              <p className="results-empty-title">Results pending</p>
              <p className="results-empty-text">Official result documents for this competition will appear here once available.</p>
            </div>
          )}
        </section>
      )}

      {/* RESULTS - Level 2 */}
      {activeTab === 'results' && disciplineLevel && !resultsLevel && (
        <section className="discipline-level">
          <div className="discipline-breadcrumbs"><span className="disc-breadcrumb-parent" onClick={() => setDisciplineLevel(false)}>Results</span><span className="disc-breadcrumb-separator">›</span><span className="disc-breadcrumb-active">{selectedEvent || 'Competitions'}</span></div>
          <div className="discipline-filter-bar">
            <div className="discipline-filter-left"></div>
            <div className="discipline-filter-right"><button className="export-btn" onClick={handleExportPDF}><i className="fa-solid fa-download"></i>EXPORT PDF</button></div>
          </div>
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

      {/* RESULTS - Level 3 */}
      {activeTab === 'results' && resultsLevel && (
        (detailLoading || !loaded) ? <LoadingResults key={`res-${selectedDiscipline}`} variant="results" onDone={() => setDetailLoading(false)} /> : (
        <section className="results-detail">
          <div className="results-detail-header"><span className="results-detail-line"></span><span className="results-detail-subtitle">ESC RESULTS</span></div>
          <h2 className="results-detail-title">{selectedDiscipline.toUpperCase()}{gender !== 'ALL' ? ` — ${gender}` : ''}</h2>
          <div className="results-detail-topbar">
            <div className="results-detail-breadcrumbs">
              <span className="rd-breadcrumb" onClick={() => { setResultsLevel(false); }}>Results</span>
              <span className="rd-breadcrumb-sep">›</span>
              <span className="rd-breadcrumb" onClick={() => setResultsLevel(false)}>{selectedEvent || 'Competitions'}</span>
              <span className="rd-breadcrumb-sep">›</span>
              <span className="rd-breadcrumb-active">{selectedDiscipline}</span>
            </div>
            <div className="results-detail-gender">
              {['ALL', 'MEN', 'WOMEN'].map((g) => <button key={g} className={`gender-btn ${gender === g ? 'active' : ''}`} onClick={() => setGender(g)}>{g}</button>)}
            </div>
          </div>
          {/* Селектор под-дисциплины — когда в грубой дисциплине несколько соревнований (3P/Prone/300m, Trap/Skeet) */}
          {subDisciplines.length > 1 && (
            <div className="subdisc-bar">
              {subDisciplines.map((sd) => (
                <button key={sd} className={`subdisc-btn ${activeSub === sd ? 'active' : ''}`} onClick={() => setSelectedSubDiscipline(sd)}>{sd}</button>
              ))}
            </div>
          )}
          {displayResults.length > 0 ? (<>
          <div className="results-table-container">
            <div className="results-table-header">
              <div className="rt-col rt-rank">RANK</div><div className="rt-col rt-athlete">ATHLETE</div><div className="rt-col rt-spacer"></div>
              <div className="rt-col rt-fed">FED</div><div className="rt-col rt-series">SERIES (SHOT BY SHOT)</div><div className="rt-col rt-total">TOTAL</div><div className="rt-col rt-inner">INNER<br />10S</div>
            </div>
            {pagedResults.map((r, i) => {
              const gi = (resultsPage - 1) * PER_PAGE + i;
              const medals = ['medal-gold', 'medal-silver', 'medal-bronze'];
              const medalClass = gi < 3 ? `medal-row ${medals[gi]}` : '';
              const shotsRaw = Array.isArray(r.shots) ? r.shots : [];
              // Максимум 24 выстрела — 12 в первой строке, 12 во второй (пустые = •)
              const shots = Array.from({ length: 24 }, (_, k) => shotsRaw[k]);
              return (
                <div key={r.id || r.athleteName} className={`results-table-row ${medalClass}`}>
                  <div className="rt-col rt-rank">{gi < 3 ? <img src={`/img/${['First', 'Second', 'Third'][gi]}_results.png`} className="rank-medal" alt="" /> : <span className="rank-num">{gi + 1}</span>}</div>
                  <div className="rt-col rt-athlete"><span className="athlete-name">{r.athleteName}</span></div>
                  <div className="rt-col rt-spacer"></div>
                  <div className="rt-col rt-fed">{r.flagEmoji ? <span className="fed-flag-emoji">{r.flagEmoji}</span> : (r.flag && <img src={getImageUrl(r.flag)} className="fed-flag-img" alt="" />)}<span>{r.federationCode}</span></div>
                  <div className="rt-col rt-series"><div className="shots-container"><div className="shots-row">{shots.slice(0, 12).map((s, si) => <span key={si} className={`shot ${getShotClass(s)}`}>{s || '•'}</span>)}</div><div className="shots-row">{shots.slice(12, 24).map((s, si) => <span key={si} className={`shot ${getShotClass(s)}`}>{s || '•'}</span>)}</div></div></div>
                  <div className="rt-col rt-total"><span className={`total-value ${gi === 0 ? 'gold-value' : ''}`}>{r.total}</span></div>
                  <div className="rt-col rt-inner"><span className={`inner-value ${gi === 0 ? 'gold-value' : ''}`}>{r.inner10s}</span></div>
                </div>
              );
            })}
          </div>

          {/* SHOT PROGRESS */}
          <div className="shot-progress">
            <div className="shot-progress-header">
              <span className="shot-progress-title">SHOT PROGRESS</span>
              <span className="shot-progress-count">Shot <b>{currentShot}</b> of {totalShots}</span>
            </div>
            <div className="progress-bar-wrapper">
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${(currentShot / totalShots) * 100}%` }}></div>
              </div>
              <div className="progress-markers">
                {shotSeries.map((s) => <span key={s} className="marker">{s}</span>)}
              </div>
            </div>
          </div>

          {/* Data source / Download — как было до правок */}
          <div className="data-source-bar">
            <div className="data-source-left">
              <span className="source-icon" aria-hidden="true"></span>
              <span className="source-label">Data source:</span>
              <span className="source-text">SIUS Scoring System</span>
              <span className="source-dot">·</span>
              <span className="source-refresh">Refreshing automatically</span>
            </div>
            <button className="download-pdf-btn" onClick={handleExportPDF}>
              <i className="fa-solid fa-download"></i> DOWNLOAD PDF
            </button>
          </div>

          <Pager page={resultsPage} setPage={setResultsPage} total={displayResults.length} />
          </>) : (
            <div className="results-empty">
              <i className="fa-regular fa-clock results-empty-icon"></i>
              <p className="results-empty-title">Results pending</p>
              <p className="results-empty-text">Official results for this discipline will appear here once the competition is complete.</p>
            </div>
          )}
        </section>
        )
      )}

      {/* RANKING TAB - Level 1 */}
      {activeTab === 'ranking' && !rankingsDetailLevel && (
        <section className="rankings-level">
          {rankingsFilterBar}
          <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC SEASON RANKINGS</span></div>
          <h2 className="discipline-title">SELECT A DISCIPLINE</h2>
          <p className="discipline-desc">Choose a discipline to view season rankings</p>
          <div className="discipline-grid ranking-grid">
            {RANKING_DISCIPLINES.map((d, i) => (
              <div key={i} className="discipline-card" onClick={() => { setRankingsDetailLevel(true); setSelectedDiscipline(d.discipline); setRankingsGender(d.gender); }}>
                <h3 className="disc-card-title"><span className="disc-main">{d.main}</span>{d.sub && <span className="disc-sub">{d.sub}</span>}</h3>
                <div className="disc-card-icon"><img src={d.icon} alt="" /><span className="disc-card-arrow">›</span></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RANKINGS DETAIL - Level 2 */}
      {activeTab === 'ranking' && rankingsDetailLevel && (
        (detailLoading || !loaded) ? <LoadingResults key={`rank-${selectedDiscipline}`} variant="ranking" onDone={() => setDetailLoading(false)} /> : (
        <section className="rankings-detail">
          {rankingsFilterBar}
          <div className="rankings-detail-breadcrumbs"><span className="rd-breadcrumb" onClick={() => setRankingsDetailLevel(false)}>Rankings</span><span className="rd-breadcrumb-sep">›</span><span className="rd-breadcrumb-active">{selectedDiscipline}</span></div>
          <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC SEASON RANKINGS</span></div>
          <div className="rankings-detail-topbar"><h2 className="rankings-detail-title">{selectedDiscipline.toUpperCase()}{rankingsGender !== 'ALL' ? ` — ${rankingsGender}` : ''}</h2></div>
          <div className="rankings-table-container">
            <div className="rankings-table-header">
              <div className="rt-col rt-rank">RANK</div><div className="rt-col rt-athlete">ATHLETE</div><div className="rt-col rt-spacer-wide"></div>
              <div className="rt-col rt-fed">FEDERATION</div><div className="rt-col rt-points">POINTS</div><div className="rt-col rt-events">EVENTS</div><div className="rt-col rt-best">BEST</div>
            </div>
            {displayRankings.length > 0 ? pagedRankings.map((r, i) => {
              const gi = (rankingsPage - 1) * PER_PAGE + i;
              const medals = ['medal-row medal-gold', 'medal-row medal-silver', 'medal-row medal-bronze'];
              const medalClass = gi < 3 ? medals[gi] : '';
              const maxPoints = parseFloat(String(displayRankings[0]?.points).replace(',', '')) || 1;
              const barWidth = (parseFloat(String(r.points).replace(',', '')) / maxPoints) * 100;
              return (
                <div key={r.id || r.athleteName} className={`rankings-table-row ${medalClass}`}>
                  <div className="rt-col rt-rank">{gi < 3 ? <img src={`/img/${['First', 'Second', 'Third'][gi]}_results.png`} className="rank-medal" alt="" /> : <span className="rank-num">{gi + 1}</span>}</div>
                  <div className="rt-col rt-athlete"><span className="athlete-name">{r.athleteName}</span></div>
                  <div className="rt-col rt-spacer-wide"></div>
                  <div className="rt-col rt-fed">{r.flagEmoji ? <span className="fed-flag-emoji">{r.flagEmoji}</span> : (r.flag && <img src={getImageUrl(r.flag)} className="fed-flag-img" alt="" />)}<span>{r.country}</span></div>
                  <div className="rt-col rt-points"><div className="points-block"><span className={`points-value ${gi === 0 ? 'gold-value' : ''}`}>{r.points}</span><div className="points-bar"><div className="points-bar-fill" style={{ width: `${barWidth}%` }}></div></div></div></div>
                  <div className="rt-col rt-events"><span className="events-value">{r.events}</span></div>
                  <div className="rt-col rt-best"><span className={`best-value ${gi === 0 ? 'gold-value' : ''}`}>{r.best}</span></div>
                </div>
              );
            }) : (
              <div className="rt-empty">
                <i className="fa-solid fa-ranking-star rt-empty-icon"></i>
                <p className="rt-empty-title">No rankings yet</p>
                <p className="rt-empty-text">Season rankings for this discipline will appear once results start coming in{rankingsSearchTerm ? ' — or try a different search' : ''}.</p>
              </div>
            )}
          </div>
          <Pager page={rankingsPage} setPage={setRankingsPage} total={displayRankings.length} />
        </section>
        )
      )}

      {/* RECORDS TAB */}
      {activeTab === 'records' && (
        <>
          {/* RECORDS — LEVEL 1: выбор категории */}
          {!disciplineLevel && !resultsLevel && (
            <section className="rankings-level">
              {rankingsFilterBar}
              <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC SEASON RECORDS</span></div>
              <h2 className="discipline-title">SELECT A CATEGORY</h2>
              <p className="discipline-desc">Select a category</p>
              <div className="discipline-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="discipline-card" onClick={() => { setDisciplineLevel(true); setSelectedCategory('World Records'); }}>
                  <h3 className="disc-card-title"><span className="disc-main">WORLD</span><span className="disc-sub">RECORDS</span></h3>
                  <div className="disc-card-icon"><img src="/img/globe.png" alt="" /><span className="disc-card-arrow">›</span></div>
                </div>
                <div className="discipline-card" onClick={() => { setDisciplineLevel(true); setSelectedCategory('Olympic Records'); }}>
                  <h3 className="disc-card-title"><span className="disc-main">OLYMPIC</span><span className="disc-sub">RECORDS</span></h3>
                  <div className="disc-card-icon"><img src="/img/rewarded_ads.png" alt="" /><span className="disc-card-arrow">›</span></div>
                </div>
              </div>
            </section>
          )}

          {/* RECORDS — LEVEL 2: выбор дисциплины */}
          {activeTab === 'records' && disciplineLevel && !resultsLevel && (
            <section className="discipline-level">
              {rankingsFilterBar}
              <div className="discipline-breadcrumbs">
                <span className="disc-breadcrumb-parent" onClick={() => setDisciplineLevel(false)}>Records</span>
                <span className="disc-breadcrumb-separator">›</span>
                <span className="disc-breadcrumb-active">{selectedCategory}</span>
              </div>
              <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC SEASON RECORDS</span></div>
              <h2 className="discipline-title">SELECT A DISCIPLINE</h2>
              <p className="discipline-desc">Choose a discipline to view season records</p>
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

          {/* RECORDS — LEVEL 3: таблица рекордов */}
          {activeTab === 'records' && resultsLevel && (
            (detailLoading || !loaded) ? <LoadingResults key={`rec-${selectedDiscipline}`} variant="records" onDone={() => setDetailLoading(false)} /> : (
            <section className="results-detail">
              {rankingsFilterBar}
              <div className="results-detail-header"><span className="results-detail-line"></span><span className="results-detail-subtitle">ESC SEASON RECORDS</span></div>
              <div className="results-detail-breadcrumbs" style={{ marginBottom: '16px' }}>
                <span className="rd-breadcrumb" onClick={() => { setResultsLevel(false); }}>Records</span>
                <span className="rd-breadcrumb-sep">›</span>
                <span className="rd-breadcrumb" onClick={() => { setResultsLevel(false); setDisciplineLevel(true); }}>{selectedCategory}</span>
                <span className="rd-breadcrumb-sep">›</span>
                <span className="rd-breadcrumb-active">{selectedDiscipline}</span>
              </div>
              <div className="rankings-detail-topbar">
                <h2 className="rankings-detail-title">{selectedDiscipline.toUpperCase()}{gender !== 'ALL' ? ` — ${gender}` : ''}</h2>
                <select className="records-category-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="ALL">CATEGORY: ALL</option>
                  <option value="MEN">CATEGORY: MEN</option>
                  <option value="WOMEN">CATEGORY: WOMEN</option>
                </select>
              </div>
              <div className="rankings-table-container">
                <div className="rankings-table-header records-grid">
                  <div className="rt-col">TYPE</div><div className="rt-col">ATHLETE</div>
                  <div className="rt-col rt-fed rt-hide-sm">FEDERATION</div><div className="rt-col">RECORD</div><div className="rt-col rt-hide-sm">LOCATION</div><div className="rt-col rt-hide-sm">DATE</div>
                </div>
                {displayRecords.length > 0 ? pagedRecords.map((r, i) => (
                  <div key={r.id || i} className="rankings-table-row records-grid">
                    <div className="rt-col"><span className="record-type">{r.type}</span></div>
                    <div className="rt-col"><span className="athlete-name">{r.athleteName}</span></div>
                    <div className="rt-col rt-fed rt-hide-sm">{r.flagEmoji ? <span className="fed-flag-emoji">{r.flagEmoji}</span> : (r.flag && <img src={getImageUrl(r.flag)} className="fed-flag-img" alt="" />)}<span>{r.federationCode}</span></div>
                    <div className="rt-col"><span className="record-value">{r.record}</span></div>
                    <div className="rt-col rt-hide-sm"><span className="record-location">{r.location}</span></div>
                    <div className="rt-col rt-hide-sm"><span className="record-date">{formatDate(r.date)}</span></div>
                  </div>
                )) : (
                  <div className="rt-empty">
                    <i className="fa-solid fa-trophy rt-empty-icon"></i>
                    <p className="rt-empty-title">No records set yet</p>
                    <p className="rt-empty-text">No records have been registered for this discipline and category yet.</p>
                  </div>
                )}
              </div>
              <Pager page={recordsPage} setPage={setRecordsPage} total={displayRecords.length} />
            </section>
            )
          )}
        </>
      )}
    </>
  );
};

export default ResultsRankingsPage;