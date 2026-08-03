'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import LoadingResults from '@/components/LoadingResults/LoadingResults';
import SkeletonEvents from '@/components/LoadingResults/SkeletonEvents';
import Pagination from '@/components/Pagination/Pagination';
import './ResultsRankingsPage.css';

// Детерминированная генерация выстрелов (9.5–10.9) без Math.random.
// count — сколько выстрелов уже сделано (остальные пустые: соревнование идёт)
const genShots = (seed, count = 11) =>
  Array.from({ length: 24 }, (_, i) => (i < count ? (9.5 + ((seed * 7 + i * 3) % 15) / 10).toFixed(1) : ''));

// Тестовые участники для демонстрации таблицы результатов (level 3)
const TEST_RESULTS = [
  { position: 1, athleteName: 'KOVÁČOVÁ ANNA', federationCode: 'CZE', flagEmoji: '🇨🇿', total: '115.4', inner10s: '6', category: 'MEN', shots: genShots(1) },
  { position: 2, athleteName: 'BECKER MARIE', federationCode: 'GER', flagEmoji: '🇩🇪', total: '113.8', inner10s: '5', category: 'WOMEN', shots: genShots(2) },
  { position: 3, athleteName: 'BOSCHETTI ELENA', federationCode: 'ITA', flagEmoji: '🇮🇹', total: '112.5', inner10s: '3', category: 'MEN', shots: genShots(3) },
  { position: 4, athleteName: 'NOVOTNÁ HANA', federationCode: 'SVK', flagEmoji: '🇸🇰', total: '110.0', inner10s: '4', category: 'WOMEN', shots: genShots(4) },
  { position: 5, athleteName: 'HANSEN INGRID', federationCode: 'NOR', flagEmoji: '🇳🇴', total: '92.0', inner10s: '2', category: 'MEN', shots: genShots(5) },
  { position: 6, athleteName: 'MÜLLER PETRA', federationCode: 'AUT', flagEmoji: '🇦🇹', total: '92.0', inner10s: '3', category: 'WOMEN', shots: genShots(6) },
  { position: 7, athleteName: 'WIŚNIEWSKA KAROLINA', federationCode: 'POL', flagEmoji: '🇵🇱', total: '61.4', inner10s: '1', category: 'MEN', shots: genShots(7) },
  { position: 8, athleteName: 'BERG INGRID', federationCode: 'SWE', flagEmoji: '🇸🇪', total: '80.8', inner10s: '2', category: 'WOMEN', shots: genShots(8) },
];

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

// Тестовые рейтинги (fallback), пока нет реальных данных по дисциплине/полу
const TEST_RANKINGS_MEN = [
  { position: 1, athleteName: 'QUIQUAMPOIX JEAN', country: 'FRA', flagEmoji: '🇫🇷', points: '1,380', events: '7', best: '245.3', category: 'MEN' },
  { position: 2, athleteName: 'KOROSTELYOV MIKAEL', country: 'SWE', flagEmoji: '🇸🇪', points: '1,295', events: '6', best: '244.8', category: 'MEN' },
  { position: 3, athleteName: 'GRÜN STEFAN', country: 'GER', flagEmoji: '🇩🇪', points: '1,244', events: '7', best: '244.2', category: 'MEN' },
  { position: 4, athleteName: 'PETROV SERGEI', country: 'BUL', flagEmoji: '🇧🇬', points: '1,198', events: '5', best: '243.6', category: 'MEN' },
  { position: 5, athleteName: 'NAGY PÉTER', country: 'HUN', flagEmoji: '🇭🇺', points: '1,154', events: '6', best: '243.0', category: 'MEN' },
  { position: 6, athleteName: 'FERRARI MARCO', country: 'ITA', flagEmoji: '🇮🇹', points: '1,109', events: '5', best: '242.4', category: 'MEN' },
  { position: 7, athleteName: 'HERNANDEZ CARLOS', country: 'ESP', flagEmoji: '🇪🇸', points: '1,072', events: '6', best: '241.8', category: 'MEN' },
  { position: 8, athleteName: 'MÜLLER HANS', country: 'AUT', flagEmoji: '🇦🇹', points: '1,038', events: '4', best: '241.2', category: 'MEN' },
];
const TEST_RANKINGS_WOMEN = [
  { position: 1, athleteName: 'KOVÁŘOVÁ ANNA', country: 'CZE', flagEmoji: '🇨🇿', points: '1,352', events: '7', best: '244.1', category: 'WOMEN' },
  { position: 2, athleteName: 'BACOSI DIANA', country: 'ITA', flagEmoji: '🇮🇹', points: '1,288', events: '6', best: '243.5', category: 'WOMEN' },
  { position: 3, athleteName: 'RUIZ FÁTIMA', country: 'ESP', flagEmoji: '🇪🇸', points: '1,230', events: '7', best: '242.9', category: 'WOMEN' },
  { position: 4, athleteName: 'JANSEN NADINE', country: 'GER', flagEmoji: '🇩🇪', points: '1,190', events: '5', best: '242.2', category: 'WOMEN' },
  { position: 5, athleteName: 'NOVOTNÁ HANA', country: 'SVK', flagEmoji: '🇸🇰', points: '1,148', events: '6', best: '241.6', category: 'WOMEN' },
  { position: 6, athleteName: 'HANSEN SOFIA', country: 'SWE', flagEmoji: '🇸🇪', points: '1,102', events: '5', best: '241.0', category: 'WOMEN' },
  { position: 7, athleteName: 'GRŽELJ ANA', country: 'SLO', flagEmoji: '🇸🇮', points: '1,065', events: '6', best: '240.4', category: 'WOMEN' },
  { position: 8, athleteName: 'MÜLLER PETRA', country: 'AUT', flagEmoji: '🇦🇹', points: '1,030', events: '4', best: '239.8', category: 'WOMEN' },
];

// Тестовые рекорды (fallback)
const TEST_RECORDS = [
  { type: 'WR', athleteName: 'QUIQUAMPOIX JEAN', federationCode: 'FRA', flagEmoji: '🇫🇷', record: '138', location: 'World Cup Munich (GER)', date: '1995-06-09', category: 'MEN' },
  { type: 'WR', athleteName: 'KOROSTELYOV MIKAEL', federationCode: 'SWE', flagEmoji: '🇸🇪', record: '129', location: 'Olympic Games Tokyo (JPN)', date: '1996-06-11', category: 'MEN' },
  { type: 'OR', athleteName: 'GRÜN STEFAN', federationCode: 'GER', flagEmoji: '🇩🇪', record: '124', location: 'Olympic Games Paris (FRA)', date: '1998-07-23', category: 'MEN' },
  { type: 'ER', athleteName: 'PETROV SERGEI', federationCode: 'BUL', flagEmoji: '🇧🇬', record: '119', location: 'European Championships Osijek (CRO)', date: '2005-08-10', category: 'MEN' },
  { type: 'EWR', athleteName: 'NAGY PÉTER', federationCode: 'HUN', flagEmoji: '🇭🇺', record: '115', location: 'World Cup Suhl (GER)', date: '2006-10-04', category: 'MEN' },
  { type: 'AR', athleteName: 'FERRARI MARCO', federationCode: 'ITA', flagEmoji: '🇮🇹', record: '110', location: 'Asian Games Hangzhou (CHN)', date: '1998-05-14', category: 'MEN' },
  { type: 'GR', athleteName: 'HERNANDEZ CARLOS', federationCode: 'ESP', flagEmoji: '🇪🇸', record: '107', location: 'European Games Kraków (POL)', date: '1994-04-01', category: 'MEN' },
  { type: 'EWR', athleteName: 'MÜLLER HANS', federationCode: 'AUT', flagEmoji: '🇦🇹', record: '103', location: 'EWR World Cup Lahti (FIN)', date: '2008-07-09', category: 'MEN' },
];

const PER_PAGE = 10;

// Обёртка над общей пагинацией (принимает total → считает pageCount)
const Pager = ({ page, setPage, total, perPage = PER_PAGE }) => (
  <Pagination page={page} pageCount={Math.ceil(total / perPage)} onChange={setPage} />
);

const ResultsRankingsPage = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState('results');
  const [events, setEvents] = useState([]);
  const [disciplineLevel, setDisciplineLevel] = useState(false);
  const [resultsLevel, setResultsLevel] = useState(false);
  const [rankingsDetailLevel, setRankingsDetailLevel] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState('10m Air Pistol');
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
  const [rankingsSearchTerm, setRankingsSearchTerm] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
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
          const res = await axios.get(`${config.API_URL}${path}&pagination[pageSize]=100&pagination[page]=${page}`);
          all.push(...(res.data?.data || []));
          const pc = res.data?.meta?.pagination?.pageCount || 1;
          if (page >= pc) break;
          page++;
        }
        return all;
      };
      try {
        // allSettled: падение одного запроса (напр. 403) не должно обнулять остальные секции
        const [eventsRes, rankingsRes, resultsRes, recordsRes] = await Promise.allSettled([
          axios.get(`${config.API_URL}/api/events?populate=*&sort=date:desc&pagination[limit]=100`),
          fetchAll(`/api/ranking-details?populate=*&sort=position:asc`),
          fetchAll(`/api/result-details?populate=*&sort=position:asc`),
          fetchAll(`/api/records?populate=*&sort=date:desc`),
        ]);
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.data) setEvents(eventsRes.value.data.data);
        if (rankingsRes.status === 'fulfilled') setRankings(rankingsRes.value);
        if (resultsRes.status === 'fulfilled') setResultDetails(resultsRes.value);
        if (recordsRes.status === 'fulfilled') setRecords(recordsRes.value);
        [eventsRes, rankingsRes, resultsRes, recordsRes]
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
  const currentYear = new Date().getFullYear();
  const years = ['all', currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(String);
  const types = ['ALL TYPES', 'CHAMPIONSHIP', 'EDUCATION', 'WORKSHOP'];
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
    setSelectedEventSlug('');
  };

  // Результаты привязаны к выбранному событию (eventSlug), затем по дисциплине/полу
  const filteredResults = resultDetails.filter(r => {
    const matchEvent = !selectedEventSlug || r.eventSlug === selectedEventSlug;
    const matchDiscipline = r.discipline?.toLowerCase() === selectedDiscipline.toLowerCase();
    const matchGender = gender === 'ALL' || r.category?.toUpperCase() === gender;
    return matchEvent && matchDiscipline && matchGender;
  });

  // Пока нет реальных данных — показываем тестовых участников
  const testResults = TEST_RESULTS.filter(r => gender === 'ALL' || r.category === gender);
  const displayResults = filteredResults.length > 0 ? filteredResults : (loaded ? testResults : []);

  // Прогресс выстрелов — по числу сделанных выстрелов у лидера
  const totalShots = 24;
  const leaderShots = Array.isArray(displayResults[0]?.shots)
    ? displayResults[0].shots.filter((s) => s && s !== '•' && s !== '-').length
    : 0;
  const currentShot = leaderShots || totalShots;
  const shotSeries = ['S1', 'S2', 'S3', 'S4'];

  const filteredRankings = rankings.filter(r => {
    const matchDiscipline = r.discipline && r.discipline.toLowerCase() === selectedDiscipline.toLowerCase();
    const matchGender = rankingsGender === 'ALL' || r.category?.toUpperCase() === rankingsGender;
    const matchSearch = !rankingsSearchTerm || r.athleteName?.toLowerCase().includes(rankingsSearchTerm.toLowerCase());
    return matchDiscipline && matchGender && matchSearch;
  });

  // Fallback тестовых рейтингов по полу, если реальных данных нет
  const testRankingsBase =
    rankingsGender === 'MEN' ? TEST_RANKINGS_MEN
      : rankingsGender === 'WOMEN' ? TEST_RANKINGS_WOMEN
        : [...TEST_RANKINGS_MEN, ...TEST_RANKINGS_WOMEN];
  const testRankings = testRankingsBase.filter(
    r => !rankingsSearchTerm || r.athleteName.toLowerCase().includes(rankingsSearchTerm.toLowerCase())
  );
  const displayRankings = filteredRankings.length > 0 ? filteredRankings : (loaded ? testRankings : []);

  // Рекорды: реальные по дисциплине/полу, иначе тестовые
  const filteredRecords = records.filter((r) => {
    const disciplineMatch = r.discipline?.trim().toLowerCase() === selectedDiscipline?.trim().toLowerCase();
    const genderMatch = gender === 'ALL' || r.category?.trim().toUpperCase() === gender;
    return disciplineMatch && genderMatch;
  });
  const testRecords = TEST_RECORDS.filter((r) => gender === 'ALL' || r.category === gender);
  const displayRecords = filteredRecords.length > 0 ? filteredRecords : (loaded ? testRecords : []);

  // Пагинация по 10 на страницу
  const pagedResults = displayResults.slice((resultsPage - 1) * PER_PAGE, resultsPage * PER_PAGE);
  const pagedRankings = displayRankings.slice((rankingsPage - 1) * PER_PAGE, rankingsPage * PER_PAGE);
  const pagedRecords = displayRecords.slice((recordsPage - 1) * PER_PAGE, recordsPage * PER_PAGE);

  // Сброс на первую страницу при смене фильтров
  useEffect(() => { setResultsPage(1); }, [selectedDiscipline, gender, selectedEvent, resultDetails.length]);
  useEffect(() => { setRankingsPage(1); }, [selectedDiscipline, rankingsGender, rankingsSearchTerm, rankings.length]);
  useEffect(() => { setRecordsPage(1); }, [selectedDiscipline, gender, records.length]);

  // Пока идёт загрузка — не показываем тестовые (иначе мелькают 6 фейковых событий)
  const eventsSource = events.length > 0 ? events : (loaded ? TEST_EVENTS : []);
  const filteredEvents = eventsSource.filter(ev => {
    const eventDate = new Date(ev.date);
    const matchType = filterType === 'ALL TYPES' || ev.type?.toUpperCase() === filterType;
    const matchStatus = filterStatus === 'ALL STATUSES' || 
      (filterStatus === 'UPCOMING' && ev.statusEvent?.toUpperCase() === 'UPCOMING') ||
      (filterStatus === 'COMPLETED' && ev.statusEvent?.toUpperCase() === 'FINISHED');
    const matchMonth = filterMonth === 'all' || eventDate.getMonth() === parseInt(filterMonth);
    const matchYear = filterYear === 'all' || eventDate.getFullYear() === parseInt(filterYear);
    return matchType && matchStatus && matchMonth && matchYear;
  });

  const getShotClass = (val) => {
    if (val === '-' || val === '•' || !val) return 'shot-miss';
    const num = parseFloat(val);
    if (num >= 10.8) return 'shot-high';
    if (num >= 10.3) return 'shot-mid';
    return 'shot-low';
  };

  const handleExportPDF = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const currentMonthLabel = filterMonth === 'all' ? '' : months.find(m => m.value === filterMonth)?.label;
  const currentYearLabel = filterYear === 'all' ? '' : filterYear;
  const dateButtonLabel = filterMonth === 'all' && filterYear === 'all'
    ? 'DATE ▼'
    : `${currentMonthLabel} ${currentYearLabel} ▼`;

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
      {activeTab === 'results' && !disciplineLevel && !resultsLevel && (
        <section className="results-events">
          {!loaded ? <SkeletonEvents /> : (<>
          <div className="events-filter-bar">
            <div className="events-filter-left">
              <div className="epc-date-filter-wrapper">
                <button className="epc-filter-btn epc-date-event" onClick={() => setShowDateFilter(!showDateFilter)}>{dateButtonLabel}</button>
                {showDateFilter && (
                  <div className="epc-date-dropdown">
                    <div className="epc-date-dropdown-section">
                      <span className="epc-date-dropdown-label">Month</span>
                      <div className="epc-date-dropdown-grid">
                        <button className={`epc-date-option ${filterMonth === 'all' ? 'epc-active' : ''}`} onClick={() => { setFilterMonth('all'); setShowDateFilter(false); }}>ALL</button>
                        {months.map((m) => <button key={m.value} className={`epc-date-option ${filterMonth === m.value ? 'epc-active' : ''}`} onClick={() => { setFilterMonth(m.value); setShowDateFilter(false); }}>{m.label}</button>)}
                      </div>
                    </div>
                    <div className="epc-date-dropdown-section">
                      <span className="epc-date-dropdown-label">Year</span>
                      <div className="epc-date-dropdown-grid">
                        {years.map((y) => <button key={y} className={`epc-date-option ${filterYear === y ? 'epc-active' : ''}`} onClick={() => { setFilterYear(y); setShowDateFilter(false); }}>{y === 'all' ? 'ALL' : y}</button>)}
                      </div>
                    </div>
                    <button className="epc-date-apply-btn" onClick={() => setShowDateFilter(false)}>APPLY</button>
                  </div>
                )}
              </div>
              <select className="events-select events-select-md" value={filterType} onChange={(e) => setFilterType(e.target.value)}>{types.map((t) => <option key={t}>{t}</option>)}</select>
              <select className="events-select events-select-md" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div className="events-filter-right"><span className="events-count-num">{filteredEvents.length}</span><span className="events-count-label">competitions</span></div>
          </div>
          <div className="events-list">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className={`event-card ${ev.statusEvent?.toUpperCase() === 'UPCOMING' ? 'event-upcoming' : 'event-completed'}`} onClick={() => { setDisciplineLevel(true); setSelectedEvent(ev.name); setSelectedEventSlug(ev.slug || ''); }}>
                <div className="event-card-left">
                  <div className="event-tags">
                    <span className={`event-status ${ev.statusEvent?.toUpperCase() === 'UPCOMING' ? 'status-upcoming' : 'status-completed'}`}>{ev.statusEvent}</span>
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
          </>)}
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
          <div className="results-table-container">
            <div className="results-table-header">
              <div className="rt-col rt-rank">RANK</div><div className="rt-col rt-athlete">ATHLETE</div><div className="rt-col rt-spacer"></div>
              <div className="rt-col rt-fed">FED</div><div className="rt-col rt-series">SERIES (SHOT BY SHOT)</div><div className="rt-col rt-total">TOTAL</div><div className="rt-col rt-inner">INNER<br />10S</div>
            </div>
            {pagedResults.map((r, i) => {
              const gi = (resultsPage - 1) * PER_PAGE + i;
              const medals = ['medal-gold', 'medal-silver', 'medal-bronze'];
              const medalClass = gi < 3 ? `medal-row ${medals[gi]}` : '';
              const shots = Array.isArray(r.shots) ? r.shots : [];
              return (
                <div key={r.id || r.athleteName} className={`results-table-row ${medalClass}`}>
                  <div className="rt-col rt-rank">{gi < 3 ? <img src={`/img/${['First', 'Second', 'Third'][gi]}_results.png`} className="rank-medal" alt="" /> : <span className="rank-num">{gi + 1}</span>}</div>
                  <div className="rt-col rt-athlete"><span className="athlete-name">{r.athleteName}</span></div>
                  <div className="rt-col rt-spacer"></div>
                  <div className="rt-col rt-fed">{r.flagEmoji ? <span className="fed-flag-emoji">{r.flagEmoji}</span> : (r.flag && <img src={getImageUrl(r.flag)} className="fed-flag-img" alt="" />)}<span>{r.federationCode}</span></div>
                  <div className="rt-col rt-series"><div className="shots-container"><div className="shots-row">{shots.slice(0, 10).map((s, si) => <span key={si} className={`shot ${getShotClass(s)}`}>{s || '•'}</span>)}</div><div className="shots-row">{shots.slice(10, 20).map((s, si) => <span key={si} className={`shot ${getShotClass(s)}`}>{s || '•'}</span>)}</div></div></div>
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
            }) : <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>No ranking data available</div>}
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
                  <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>No records available</div>
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