'use client';
import { useState, useEffect, useMemo, Fragment } from 'react';
import { cachedGet } from '@/lib/apiCache';
import config from '@/lib/config';
import LoadingResults from '@/components/LoadingResults/LoadingResults';
import SkeletonEvents from '@/components/LoadingResults/SkeletonEvents';
import Pagination from '@/components/Pagination/Pagination';
import DateFilter from '@/components/DateFilter/DateFilter';
import { downloadFile as forceDownload } from '@/lib/download';
import { fileTypeMeta } from '@/lib/fileType';
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

// Records: базовая дисциплина = имя без хвостовых вариативных токенов (Solo/Trio/Duet/Team/Mixed/
// Open/Junior/Men/Women/U16/U18); вариант = остаток. Позволяет строить сетку/фильтры динамически.
const REC_VARIANT_TOK = /^(solo|trio|duet|mixed|team|open|junior|men|women|u16|u18)$/i;
const recordBase = (d) => { const t = String(d || '').trim().split(/\s+/); while (t.length && REC_VARIANT_TOK.test(t[t.length - 1])) t.pop(); return t.join(' '); };
const recIcon = (base) => (/trap|skeet/i.test(base) ? IC_SHOTGUN : /pistol/i.test(base) ? IC_PISTOL : IC_RIFLE);

// Флаг для РЕКОРДОВ (исторический): показываем все, включая RUS (флаг России) и URS (флаг СССР — SIUS
// его не отдаёт, берём локальный). AIN → эмблема нейтрального атлета. Отличается от flagFor (в Results
// у RUS флага нет). "AIN2"/"SUI1" → базовый код.
const USSR_FLAG = '/img/flag-urs.svg';
const recordFlagFor = (code) => {
  const c = String(code || '').trim().toUpperCase().replace(/\s.*$/, '').replace(/\d+$/, '');
  if (!c) return null;
  if (c === 'URS') return USSR_FLAG;
  return `https://shootingsportscloud.com:8594/api/v1/Resource/flag/${c}`;
};
// Официальные документы рекордов (esc-shooting.org): Senior+Junior и отдельно U16/U18. Обе — цели кнопок в Records.
const OFFICIAL_RECORDS_PDF = 'https://esc-shooting.org/storage/2026/07/31/57b358c07315ac4a00714ba62aa252bb24170e56.pdf';
const OFFICIAL_RECORDS_PDF_U16 = 'https://esc-shooting.org/storage/2026/05/29/a5f662fce904d17132fbb4f00ba9c9d72df5e431.pdf';
// Официальные PDF рейтинга (esc-shooting.org/documents/ranking, дек. 2025) — источник таблиц
// Rank/Name/Nation/Year of birth, по одному на дисциплину+пол. Ключ: `${discipline}|${GENDER}`.
const OFFICIAL_RANKING_PDF = {
  '10m Air Pistol|MEN': 'https://esc-shooting.org/storage/2025/12/01/49fa32ef4e0d11bb746a4da95b5751dd25172787.pdf',
  '10m Air Rifle|MEN': 'https://esc-shooting.org/storage/2025/12/01/9e3dd623e56383738ecdf1cc73fc0021ea6a5a75.pdf',
  '25m Rapid Fire Pistol|MEN': 'https://esc-shooting.org/storage/2025/12/01/4ca6d4afc9703df3810b08ba804b0efe92c7f7e0.pdf',
  '50m Rifle 3 Position|MEN': 'https://esc-shooting.org/storage/2025/12/01/413a5eb181e1e4d00ede51e0941c59724bfbf0eb.pdf',
  'Skeet|MEN': 'https://esc-shooting.org/storage/2025/12/01/ff0bdab06f46fcdb0a58f06e962cb9d7ce88f81c.pdf',
  'Trap|MEN': 'https://esc-shooting.org/storage/2025/12/01/6696c29f23b9b723c9127e6df6df3ae9d9b77255.pdf',
  '10m Air Pistol|WOMEN': 'https://esc-shooting.org/storage/2025/12/01/506c83ff806ed005f226770f0d4ab5ec4a2979c4.pdf',
  '10m Air Rifle|WOMEN': 'https://esc-shooting.org/storage/2025/12/01/a771c81bc92512d1535c1d9f05fe6e0bcbc320a7.pdf',
  '25m Pistol|WOMEN': 'https://esc-shooting.org/storage/2025/12/01/a51d6378c4f046a02b8ff96541e2f145791810cf.pdf',
  '50m Rifle 3 Position|WOMEN': 'https://esc-shooting.org/storage/2025/12/01/9762a74245d0ac30b6c49062fc2dc47e520e9a68.pdf',
  'Skeet|WOMEN': 'https://esc-shooting.org/storage/2025/12/01/6a7755e66aa54a542347dfb8aed7ef75a68abe70.pdf',
  'Trap|WOMEN': 'https://esc-shooting.org/storage/2025/12/01/7184f96a772fc426086996e3e524238bb62f1bcd.pdf',
};
// Легенда типов рекордов — как в официальном PDF.
const RECORD_TYPE_LEGEND = [
  ['ER', 'European Record'], ['EER', 'Equalled European Record'],
  ['QER', 'Qualification European Record'], ['EQER', 'Equalled Qualification European Record'],
  ['ERT', 'European Record Team'], ['EERT', 'Equalled European Record Team'],
  ['QERT', 'Qualification European Record Team'],
  ['ERJ', 'European Record Junior'], ['EERJ', 'Equalled European Record Junior'],
  ['QERJ', 'Qualification European Record Junior'], ['EQERJ', 'Equalled Qualification European Record Junior'],
  ['ERJT', 'European Record Junior Team'], ['EERJT', 'Equalled European Record Junior Team'],
  ['QERJT', 'Qualification European Record Junior Team'],
];
const RECORD_TYPE_ORDER = RECORD_TYPE_LEGEND.map((x) => x[0]);
const typeRank = (t) => { const i = RECORD_TYPE_ORDER.indexOf(String(t || '').toUpperCase()); return i < 0 ? 99 : i; };

// Разворот по-выстрельно: группируем выстрелы по ФАКТИЧЕСКИМ сериям — набираем выстрелы, пока их сумма
// не сравняется с сабтоталом серии (shotsRaw). Нужно для нерегулярных финалов (10m Air Rifle: 5+5+2·7=24,
// где единый размер серии неверен). Если суммы не сходятся (дуэли/шотган/битые данные) — фолбэк равномерно.
const groupShots = (detail, subtotals, grpSize) => {
  const subs = (subtotals || []).map((s) => parseFloat(String(s).replace(',', '.'))).filter((n) => !isNaN(n));
  const nums = detail.map((s) => parseFloat(String(s).replace(',', '.')));
  const uniformCount = Math.ceil(detail.length / grpSize);
  const irregular = subs.length >= 2 && uniformCount !== subs.length; // равномерная разбивка ≠ числу серий → финал
  const decimal = detail.some((s) => String(s).includes('.'));         // винтовка/пистолет (НЕ hit/miss шотгана)
  if (irregular && decimal && nums.every((n) => !isNaN(n))) {
    const groups = []; let i = 0; let ok = true;
    for (let gi = 0; gi < subs.length && i < detail.length; gi++) {
      let sum = 0; const grp = [];
      while (i < detail.length && sum + nums[i] <= subs[gi] + 0.05) {
        sum += nums[i]; grp.push(detail[i]); i++;
        if (Math.abs(sum - subs[gi]) < 0.05) break;
      }
      if (!grp.length || Math.abs(sum - subs[gi]) > 0.06) { ok = false; break; }
      groups.push(grp);
    }
    if (ok && i >= detail.length && groups.length === subs.length) return groups;
  }
  return Array.from({ length: uniformCount }, (_, si) => detail.slice(si * grpSize, si * grpSize + grpSize));
};
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
  const [openGroup, setOpenGroup] = useState(''); // раскрытая группа стадий в селекторе под-дисциплин
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventSlug, setSelectedEventSlug] = useState('');
  const [rankings, setRankings] = useState([]);
  const [resultDetails, setResultDetails] = useState([]);
  const [expandedId, setExpandedId] = useState(null);   // развёрнутая строка (по-выстрельно)
  const [shotCache, setShotCache] = useState({});        // id -> shotDetail[] (тянем по клику)
  const [loadedSlugs, setLoadedSlugs] = useState(new Set()); // события, чьи строки уже подгружены
  const [records, setRecords] = useState([]);
  const [expandedRec, setExpandedRec] = useState(null); // раскрытый командный рекорд (показ всех участников)
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
  const [loaded, setLoaded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false); // короткая загрузка при входе на таблицу (3 уровень)
  const [selectedEventBooks, setSelectedEventBooks] = useState([]); // ЦЕЛЫЕ официальные result-book выбранного события (не порезанный по-событийный SIUS-файл)

  useEffect(() => {
    const fetchData = async () => {
      // Strapi ограничивает pageSize (макс 100). Records/rankings/results > 100 строк,
      // поэтому листаем страницы, иначе часть дисциплин выпадает и показываются TEST-данные.
      const fetchAll = async (path, pageSize = 1000) => {
        let page = 1, all = [];
        while (page <= 150) {
          const res = await cachedGet(`${config.API_URL}${path}&pagination[pageSize]=${pageSize}&pagination[page]=${page}`);
          all.push(...(res.data?.data || []));
          const pc = res.data?.meta?.pagination?.pageCount || 1;
          if (page >= pc) break;
          page++;
        }
        return all;
      };
      try {
        // allSettled: падение одного запроса (напр. 403) не должно обнулять остальные секции
        // Событий грузим ЛЁГКИЙ список (без populate документов — это раздувало ответ ×12).
        // Строки атлетов (result-details) и документы события тянем ПО КЛИКУ (ленивая загрузка):
        // стартовая загрузка страницы падает с ~10 МБ до ~250 КБ.
        const [eventsRes, rankingsRes, recordsRes, docsRes] = await Promise.allSettled([
          fetchAll(`/api/events?sort=date:desc&fields[0]=slug&fields[1]=name&fields[2]=date&fields[3]=endDate&fields[4]=type&fields[5]=disciplines&fields[6]=statusEvent&fields[7]=hasResults&fields[8]=hasResultBook&fields[9]=category&fields[10]=location`),
          fetchAll(`/api/ranking-details?populate=*&sort=position:asc`),
          fetchAll(`/api/records?populate=*&sort=date:desc`),
          fetchAll(`/api/docs?filters[title][$contains]=Historical&populate[attachments][populate]=file`),
        ]);
        if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value);
        if (rankingsRes.status === 'fulfilled') setRankings(rankingsRes.value);
        if (recordsRes.status === 'fulfilled') setRecords(recordsRes.value);
        if (docsRes.status === 'fulfilled') setDocs(docsRes.value);
        [eventsRes, rankingsRes, recordsRes, docsRes]
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
    { main: '50M', sub: 'PISTOL', id: '50m-pistol', icon: '/img/Icon1.png' },
    { main: '50M', sub: 'RIFLE', id: '50m-rifle', icon: '/img/Icon2.png' },
    { main: '300M', sub: 'RIFLE', id: '300m-rifle', icon: '/img/Icon2.png' },
    { main: 'MOVING', sub: 'TARGET', id: 'moving-target', icon: '/img/Icon3.png' },
    { main: 'SHOTGUN', sub: '', id: 'shotgun', icon: '/img/Icon4.png' },
  ];

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setDisciplineLevel(false);
    setResultsLevel(false);
    setRankingsDetailLevel(false);
    setPdfLevel(false);
    setSelectedEventSlug('');
    setGender('ALL'); // records может выставить MIXED — сбрасываем, чтобы не «утекало» в Results
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

  // Результаты выбранного события+дисциплины (БЕЗ фильтра пола) — источник для доступных полов.
  const eventDisciplineAll = resultDetails.filter((r) =>
    (!selectedEventSlug || r.eventSlug === selectedEventSlug) &&
    r.discipline?.toLowerCase() === selectedDiscipline.toLowerCase());
  // Полы, реально присутствующие → динамические кнопки ALL/MEN/WOMEN. У CL-Shotgun (SKEET/TRAP SOLO)
  // всё в категории ALL, поэтому MEN/WOMEN не показываем — иначе фильтр обнулял бы таблицу и вкладки.
  // Если выбранный пол недоступен у события (пришли с MEN) — эффективно показываем всё.
  const availGenders = new Set(eventDisciplineAll.map((r) => (r.category || '').toUpperCase()));
  const genderBtns = ['ALL', ...['MEN', 'WOMEN'].filter((g) => availGenders.has(g))];
  const effGender = (gender !== 'ALL' && !availGenders.has(gender)) ? 'ALL' : gender;
  const eventDisciplineResults = eventDisciplineAll.filter((r) =>
    effGender === 'ALL' || (r.category || '').toUpperCase() === effGender);
  // Под-дисциплины внутри выбранной грубой дисциплины (напр. 3 Positions / Prone / 300m).
  // Разные соревнования нельзя мешать в одну таблицу — показываем селектором.
  const subDisciplines = Array.from(new Set(eventDisciplineResults.map((r) => r.subDiscipline).filter(Boolean)));
  const activeSub = selectedSubDiscipline && subDisciplines.includes(selectedSubDiscipline)
    ? selectedSubDiscipline
    : (subDisciplines[0] || '');
  // Группируем под-дисциплины по СТАДИИ (часть после « — »): Qualification, Semifinals, Medal Match…
  // Табов бывает много (у Moving Target ~19: пол × юниоры × команда × стадии) — показываем аккордеоном.
  const teamSubs = new Set(eventDisciplineResults.filter((r) => r.isTeam).map((r) => r.subDiscipline));
  const stageGroup = (sd) => {
    if (teamSubs.has(sd)) return 'Teams';               // командные зачёты — в отдельную группу, не в «Individual»
    const s = (String(sd).split(' — ')[1] || '').trim().toLowerCase();
    if (!s) return 'Results';
    if (/qualif|phase|part|\bstage\b/.test(s)) return 'Qualification';
    if (/quarter/.test(s)) return 'Quarter Finals';
    if (/semi.?final/.test(s)) return 'Semifinals';
    if (/gold\s*medal/.test(s)) return 'Gold Medal Match';
    if (/bronze\s*medal/.test(s)) return 'Bronze Medal Match';
    if (/medal/.test(s)) return 'Medal Matches';
    if (/ranking/.test(s)) return 'Ranking Match';
    if (/final/.test(s)) return 'Final';
    return (String(sd).split(' — ')[1] || '').trim();
  };
  const GROUP_ORDER = ['Qualification', 'Quarter Finals', 'Semifinals', 'Final', 'Bronze Medal Match', 'Gold Medal Match', 'Medal Matches', 'Ranking Match', 'Results', 'Teams'];
  const subGroups = {};
  subDisciplines.forEach((sd) => { const g = stageGroup(sd); (subGroups[g] = subGroups[g] || []).push(sd); });
  const orderedGroups = Object.keys(subGroups).sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  const activeGroup = stageGroup(activeSub);          // группа, содержащая текущую вкладку
  const shownGroup = openGroup || activeGroup;         // какая группа раскрыта
  // Порядок стадий внутри одного события: Qualification → Semifinal → Bronze → Gold → …
  const stageRank = (sd) => {
    const s = (String(sd).split(' — ')[1] || '').toLowerCase();
    if (/qualif|phase|part|\bstage\b/.test(s)) return 0;
    if (/quarter/.test(s)) return 1;
    if (/semi.?final/.test(s)) return 2;
    if (/bronze/.test(s)) return 3;
    if (/gold/.test(s)) return 4;
    if (/medal/.test(s)) return 5;
    if (/final/.test(s)) return 6;
    if (/ranking/.test(s)) return 7;
    return 9;
  };
  // Второй уровень фильтра внутри группы (важно для TEAMS — там десятки зачётов): группируем
  // вкладки по «событию» (часть до « — »). Одностадийные → одиночный чип с названием события;
  // многостадийные → подпись события + компактные чипы стадий. 18 плоских кнопок → ~8 строк.
  const renderSubItems = (items) => {
    const byVariant = {};
    items.forEach((sd) => { const v = sd.split(' — ')[0]; (byVariant[v] = byVariant[v] || []).push(sd); });
    const variants = Object.keys(byVariant).sort((a, b) => a.localeCompare(b));
    const nested = variants.some((v) => byVariant[v].length > 1);
    if (!nested) {
      return (
        <div className="subdisc-bar">
          {variants.map((v) => { const sd = byVariant[v][0]; return (
            <button key={sd} className={`subdisc-btn ${activeSub === sd ? 'active' : ''}`} onClick={() => setSelectedSubDiscipline(sd)}>{v}</button>
          ); })}
        </div>
      );
    }
    return (
      <div className="subdisc-nested">
        {variants.map((v) => {
          const stages = byVariant[v].slice().sort((a, b) => stageRank(a) - stageRank(b) || a.localeCompare(b));
          if (stages.length === 1) {
            const sd = stages[0];
            return <button key={sd} className={`subdisc-btn ${activeSub === sd ? 'active' : ''}`} onClick={() => setSelectedSubDiscipline(sd)}>{v}</button>;
          }
          return (
            <div className="subdisc-subgroup" key={v}>
              <span className="subdisc-subgroup-label">{v}</span>
              <div className="subdisc-substages">
                {stages.map((sd) => { const stage = sd.split(' — ').slice(1).join(' — ') || 'Result'; return (
                  <button key={sd} className={`subdisc-btn subdisc-btn-sm ${activeSub === sd ? 'active' : ''}`} onClick={() => setSelectedSubDiscipline(sd)}>{stage}</button>
                ); })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  // Порядок: по месту (position), unranked (0) — в конец, при равенстве — по тоталу убыв.
  const posKey = (r) => (r.position && r.position > 0 ? r.position : 9999);
  const totKey = (r) => parseFloat((String(r.total).match(/[\d.]+/) || [0])[0]) || 0;
  const _seenAthlete = new Set();
  const filteredResults = eventDisciplineResults
    .filter((r) => !activeSub || (r.subDiscipline || '') === activeSub)
    .sort((a, b) => (posKey(a) - posKey(b)) || (totKey(b) - totKey(a)))
    // Дедуп по атлету (SIUS может вернуть его в нескольких squad-группах) — оставляем лучший (первый после сортировки)
    .filter((r) => { const k = (r.athleteName || '').trim().toLowerCase(); if (!k) return true; if (_seenAthlete.has(k)) return false; _seenAthlete.add(k); return true; });

  // Только реальные данные: если для дисциплины/пола результатов нет — покажем пустое состояние
  const displayResults = filteredResults;

  // Грубые дисциплины, реально присутствующие у выбранного события (для уровня 2 — без пустых плашек).
  const eventDisciplines = useMemo(() => new Set(
    resultDetails.filter((r) => r.eventSlug === selectedEventSlug).map((r) => (r.discipline || '').toUpperCase())
  ), [resultDetails, selectedEventSlug]);


  const filteredRankings = rankings.filter(r => {
    const matchDiscipline = r.discipline && r.discipline.toLowerCase() === selectedDiscipline.toLowerCase();
    const matchGender = rankingsGender === 'ALL' || r.category?.toUpperCase() === rankingsGender;
    const matchSearch = !rankingsSearchTerm || r.athleteName?.toLowerCase().includes(rankingsSearchTerm.toLowerCase());
    return matchDiscipline && matchGender && matchSearch;
  });

  // Для gender-специфичного вида — чистый порядок по официальному месту; для ALL — сначала
  // все MEN (1..N), затем все WOMEN (1..N), чтобы не мешались два первых места вперемешку.
  const displayRankings = [...filteredRankings].sort((a, b) =>
    a.category === b.category ? ((a.position || 0) - (b.position || 0)) : (a.category === 'MEN' ? -1 : 1)
  );

  // Базовые дисциплины рекордов — динамически из данных (для сетки выбора Level 1).
  const recordBases = useMemo(() => {
    const m = new Map();
    records.forEach((r) => { const b = recordBase(r.discipline); if (b) m.set(b, (m.get(b) || 0) + 1); });
    return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);
  // Категории, реально присутствующие в выбранной базовой дисциплине (динамический фильтр).
  // 'ALL' = показать всё (в т.ч. Open-рекорды с category='ALL'); плюс MEN/WOMEN/MIXED если есть.
  const recordCatOptions = useMemo(() => {
    const present = new Set(records.filter((r) => recordBase(r.discipline) === selectedDiscipline).map((r) => (r.category || '').toUpperCase()));
    return ['ALL', ...['MEN', 'WOMEN', 'MIXED'].filter((c) => present.has(c))];
  }, [records, selectedDiscipline]);
  // Рекорды выбранной базовой дисциплины: фильтр по категории + поиску.
  const filteredRecords = records.filter((r) => {
    const baseMatch = recordBase(r.discipline) === selectedDiscipline;
    const catMatch = gender === 'ALL' || (r.category || '').toUpperCase() === gender;
    const searchMatch = !rankingsSearchTerm || (r.athleteName || '').toLowerCase().includes(rankingsSearchTerm.toLowerCase());
    return baseMatch && catMatch && searchMatch;
  });
  const displayRecords = filteredRecords;
  // Группировка по полной дисциплине — подзаголовки как в официальном PDF (Men → Women → Mixed; тип по порядку).
  const REC_CAT_RANK = { MEN: 0, WOMEN: 1, MIXED: 2, ALL: 3 };
  const recordGroups = (() => {
    const g = {};
    displayRecords.forEach((r) => { (g[r.discipline] = g[r.discipline] || []).push(r); });
    return Object.entries(g)
      .map(([disc, list]) => [disc, list.slice().sort((a, b) => typeRank(a.type) - typeRank(b.type))])
      .sort((a, b) => ((REC_CAT_RANK[a[1][0].category] ?? 9) - (REC_CAT_RANK[b[1][0].category] ?? 9)) || a[0].localeCompare(b[0]));
  })();

  // Командный вид (строки-команды) и официальный PDF-ранклист текущей выборки
  const teamView = displayResults[0]?.isTeam || false;
  const viewPdfUrl = displayResults.find((r) => r.pdfUrl)?.pdfUrl || '';
  // Целый официальный result-book события приоритетнее по-событийного SIUS-ранклиста (тот — порезанный).
  const officialBookFile = selectedEventBooks[0]?.file || null;
  const officialBookUrl = officialBookFile ? (String(officialBookFile.url).startsWith('http') ? officialBookFile.url : `${config.API_URL}${officialBookFile.url}`) : '';
  const officialPdfUrl = officialBookUrl || viewPdfUrl;
  // Колонку INNER 10s показываем только если она реально заполнена (у шотгана/дуэлей CL её нет).
  const hasInner = displayResults.some((r) => r.inner10s && String(r.inner10s).trim());
  // Пагинация по 10 на страницу
  const pagedResults = displayResults.slice((resultsPage - 1) * PER_PAGE, resultsPage * PER_PAGE);
  const pagedRankings = displayRankings.slice((rankingsPage - 1) * PER_PAGE, rankingsPage * PER_PAGE);

  // Сброс на первую страницу при смене фильтров
  useEffect(() => { setResultsPage(1); }, [selectedDiscipline, selectedSubDiscipline, gender, selectedEvent, resultDetails.length]);
  // При смене дисциплины/события/пола сбрасываем раскрытую группу (откроется группа активной вкладки).
  useEffect(() => { setOpenGroup(''); }, [selectedDiscipline, selectedEvent, gender]);
  useEffect(() => { setRankingsPage(1); }, [selectedDiscipline, rankingsGender, rankingsSearchTerm, rankings.length]);

  // Показываем только события, у которых реально есть результаты (как на офиц. сайте):
  // либо структурные (SIUS), либо official result-book PDF. Иначе среди 800+ событий
  // календаря пользователь кликает пустые.
  const historicalArchive = useMemo(() => {
    const d = docs.find((x) => /historical results|1955/i.test(x.title || ''));
    return d ? { title: d.title, files: (d.attachments || []).filter((a) => a.file) } : null;
  }, [docs]);
  // Показываем: завершённые с результатами (флаги hasResults/hasResultBook) + предстоящие/идущие
  // соревнования (как «RESULTS PENDING»). Скрываем только прошедшие без результатов.
  const isCompetition = (e) => (e.type || 'competition').toLowerCase() === 'competition';
  const eventsWithResults = events.filter((e) =>
    e.hasResults || e.hasResultBook || (evStatus(e) !== 'FINISHED' && isCompetition(e)));
  const eventsSource = events.length > 0 ? eventsWithResults : (loaded ? TEST_EVENTS : []);

  // Ленивая загрузка строк атлетов события (по клику) — аккумулируем в resultDetails, кэш 3 мин.
  const loadEventResults = async (slug) => {
    if (!slug || loadedSlugs.has(slug)) return;
    const F = '&fields[0]=position&fields[1]=athleteName&fields[2]=federationCode&fields[3]=total&fields[4]=inner10s&fields[5]=discipline&fields[6]=subDiscipline&fields[7]=category&fields[8]=shots&fields[9]=isTeam&fields[10]=pdfUrl&fields[11]=eventSlug';
    let page = 1; const all = [];
    while (page <= 10) {
      const res = await cachedGet(`${config.API_URL}/api/result-details?filters[eventSlug][$eq]=${encodeURIComponent(slug)}&sort=position:asc${F}&pagination[pageSize]=1000&pagination[page]=${page}`);
      all.push(...(res.data?.data || []));
      const pc = res.data?.meta?.pagination?.pageCount || 1;
      if (page >= pc) break;
      page++;
    }
    setResultDetails((prev) => [...prev.filter((r) => r.eventSlug !== slug), ...all]);
    // Помечаем загруженным ТОЛЬКО если реально что-то пришло. Иначе (пустой ответ во время
    // ночного переимпорта, когда данные пересоздаются) — повторим при следующем открытии,
    // а не покажем навсегда пустой список дисциплин.
    if (all.length) setLoadedSlugs((s) => new Set(s).add(slug));
  };
  // Ленивая загрузка result-book PDF события (по клику) — тянем документы только этого события.
  const loadEventResultBook = async (slug) => {
    try {
      const res = await cachedGet(`${config.API_URL}/api/events?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[documents][populate]=file&pagination[pageSize]=1`);
      const ev = res.data?.data?.[0];
      const list = ev?.documents || ev?.attributes?.documents || [];
      return list.filter((d) => RESULT_RE.test(d.name || '') && d.file).map((d) => ({ name: d.name, file: d.file, fileSize: d.fileSize }));
    } catch { return []; }
  };

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

  // Значения — суммы серий / попадания по станциям, а не одиночные выстрелы, и их шкала
  // разная (AR ~105, шотган-квал 25, дуэли Champions League 1–5). Красим ОТНОСИТЕЛЬНО пика
  // в текущей выборке — так работает для любого формата без жёстких порогов.
  const seriesPeak = useMemo(() => {
    const vals = displayResults.flatMap((r) => (Array.isArray(r.shots) ? r.shots : []).map((s) => parseFloat(s)).filter((n) => !isNaN(n)));
    return vals.length ? Math.max(...vals) : 1;
  }, [displayResults]);
  const getShotClass = (val) => {
    if (val === '-' || val === '•' || !val) return 'shot-miss';
    const num = parseFloat(val);
    if (isNaN(num)) return 'shot-miss'; // «—», «–» и прочие маркеры-заглушки
    const ratio = num / seriesPeak;
    if (ratio >= 0.97) return 'shot-high';
    if (ratio >= 0.85) return 'shot-mid';
    return 'shot-low';
  };
  // Покраска ОДИНОЧНОГО выстрела (10.8, 10.3… у винтовки/пистолета; 1/0 hit-miss у шотгана).
  const getSingleShotClass = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 'shot-miss';
    if (num >= 10.5) return 'shot-high';  // внутренняя десятка / X
    if (num >= 10.0) return 'shot-mid';   // десятка
    if (num >= 9.0) return 'shot-low';    // девятка
    if (num >= 1) return 'shot-mid';      // попадание шотгана / низкое кольцо
    return 'shot-miss';                   // 0 = промах
  };
  // Дуэль/очковый формат: сумма серий сильно больше тотала (тотал = очки матча, а не сумма выстрелов).
  // В таких строках разворот по-выстрельно вводит в заблуждение — не раскрываем.
  const isPointsRow = (r) => {
    const ss = (Array.isArray(r.shots) ? r.shots : []).reduce((a, s) => a + (parseFloat(s) || 0), 0);
    const t = parseFloat(r.total) || 0;
    return ss > 0 && t > 0 && ss > t * 1.8;
  };
  const canExpand = (r) => !r.isTeam && !isPointsRow(r);
  // Флаг по IOC-коду — ресурс флагов SIUS. РОССИИ (RUS) флаг НЕ ставим. AIN (нейтральный атлет)
  // получает официальную эмблему "Individual Neutral Athlete" — SIUS отдаёт её по коду AIN.
  // "SUI1"/"AIN A" → базовый код.
  const flagFor = (code) => {
    const c = String(code || '').trim().toUpperCase().replace(/\s.*$/, '').replace(/\d+$/, '');
    if (!c || c === 'RUS') return null;
    return `https://shootingsportscloud.com:8594/api/v1/Resource/flag/${c}`;
  };
  // По клику на строку атлета тянем по-выстрельно (по одному запросу, кэшируем).
  const toggleShots = async (r) => {
    if (!canExpand(r) || !r.id) return;
    if (expandedId === r.id) { setExpandedId(null); return; }
    setExpandedId(r.id);
    if (shotCache[r.id] === undefined) {
      try {
        const res = await cachedGet(`${config.API_URL}/api/result-details?filters[id][$eq]=${r.id}&fields[0]=shotDetail&pagination[pageSize]=1`);
        const row = res.data?.data?.[0];
        const sd = row?.shotDetail ?? row?.attributes?.shotDetail ?? [];
        setShotCache((c) => ({ ...c, [r.id]: Array.isArray(sd) ? sd : [] }));
      } catch { setShotCache((c) => ({ ...c, [r.id]: [] })); }
    }
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
        {/* Дисциплина: у Records список строится ДИНАМИЧЕСКИ из самих рекордов (recordBases) и ведёт
            в records-деталь; у Ranking — фиксированные 12 дисциплин рейтинга. */}
        {activeTab === 'records' ? (
          <select className="events-select" value="" onChange={(e) => {
            const b = recordBases.find((x) => x.name === e.target.value);
            if (b) { setSelectedDiscipline(b.name); setGender('ALL'); setResultsLevel(true); }
          }}>
            <option value="">Discipline</option>
            {recordBases.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        ) : (
          <select className="events-select" value="" onChange={(e) => {
            const d = RANKING_DISCIPLINES.find((x) => `${x.main} ${x.sub}`.trim() === e.target.value);
            if (d) { setSelectedDiscipline(d.discipline); setRankingsGender(d.gender); setGender(d.gender); setRankingsDetailLevel(true); }
          }}>
            <option value="">Discipline</option>
            {rankingDisciplineOptions.map((o) => <option key={o}>{o}</option>)}
          </select>
        )}
        {/* Пол: Records фильтруются по общему `gender` (тем же, что использует records-деталь),
            Ranking — по `rankingsGender`. Раньше на Records этот дропдаун писал не в то состояние. */}
        {activeTab === 'records' ? (
          <select className="events-select" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="ALL">Gender</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
            <option value="MIXED">Mixed</option>
          </select>
        ) : (
          <select className="events-select" value={rankingsGender} onChange={(e) => setRankingsGender(e.target.value)}>
            <option value="ALL">Gender</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </select>
        )}
      </div>
      {/* Ссылаемся только на официальные документы: у Records — офиц. PDF рекордов; у Results/Ranking
          официальные PDF показаны в самой детали (result-book / per-discipline ranking). Общего
          «экспорта нашей таблицы» тут нет. */}
      {activeTab === 'records' && (
        <div className="records-pdf-btns">
          <button className="export-btn" onClick={() => window.open(OFFICIAL_RECORDS_PDF, '_blank', 'noopener')} title="Senior & Junior European records — official PDF"><i className="fa-solid fa-download"></i>OFFICIAL PDF</button>
          <button className="export-btn export-btn-sec" onClick={() => window.open(OFFICIAL_RECORDS_PDF_U16, '_blank', 'noopener')} title="U16 / U18 European records — official PDF"><i className="fa-solid fa-download"></i>U16/U18 PDF</button>
        </div>
      )}
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
                onClick={isUpcoming ? undefined : async () => {
                  setSelectedEvent(ev.name);
                  setSelectedEventSlug(ev.slug || `__ev-${ev.id}__`);
                  // Есть структура (SIUS) → грузим строки события и открываем выбор дисциплины;
                  // иначе → грузим result-book PDF события и открываем PDF-просмотр. Обе — по клику.
                  if (ev.hasResults) {
                    setDetailLoading(true);
                    // Параллельно тянем строки SIUS И целый официальный result-book события —
                    // чтобы кнопка «OFFICIAL PDF» вела на цельный файл, а не на порезанный SIUS-ранклист.
                    const [, books] = await Promise.all([loadEventResults(ev.slug), loadEventResultBook(ev.slug)]);
                    setSelectedEventBooks(books || []);
                    setDetailLoading(false);
                    setDisciplineLevel(true);
                  } else {
                    const files = await loadEventResultBook(ev.slug);
                    openPdfView(ev.name, files);
                  }
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
                    : <button className="event-view-btn">{ev.hasResults ? 'VIEW >' : <><i className="fa-regular fa-file-pdf" style={{ marginRight: 6 }}></i>VIEW PDF</>}</button>}
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
              {pdfFiles.map((f, i) => {
                const ft = fileTypeMeta(f.file, f.name);
                return (
                <div className="results-archive-item" key={i}>
                  <i className={`fa-solid ${ft.icon} results-archive-icon`} style={{ color: ft.color }}></i>
                  <div className="results-archive-info">
                    <span className="results-archive-name">{f.name}</span>
                    <span className="results-archive-meta">{f.fileSize || ft.label}</span>
                  </div>
                  <button className="results-archive-btn" onClick={() => previewFile(f.file)} title="Open in browser"><i className="fa-solid fa-eye"></i> Preview</button>
                  <button className="results-archive-btn results-archive-btn-dl" onClick={() => downloadResultFile(f.name, f.file)} title="Download"><i className="fa-solid fa-download"></i> {ft.label}</button>
                </div>
                );
              })}
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
          <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC RESULTS</span></div>
          <h2 className="discipline-title">SELECT A DISCIPLINE</h2>
          <p className="discipline-desc">Choose a discipline to view results</p>
          <div className="discipline-grid">
            {disciplines.filter((d) => eventDisciplines.has(`${d.main} ${d.sub}`.trim().toUpperCase())).map((d) => (
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
              {genderBtns.map((g) => <button key={g} className={`gender-btn ${effGender === g ? 'active' : ''}`} onClick={() => setGender(g)}>{g}</button>)}
            </div>
          </div>
          {/* Селектор под-дисциплины. Много вкладок → группируем по стадиям в аккордеон (раскрывается
              по одной группе), мало и все без стадий → плоская полоса как раньше. */}
          {subDisciplines.length > 1 && (
            orderedGroups.length > 1 ? (
              <div className="subdisc-accordion">
                {orderedGroups.map((grp) => {
                  const items = subGroups[grp];
                  const isOpen = shownGroup === grp;
                  return (
                    <div className={`subdisc-group ${isOpen ? 'open' : ''}`} key={grp}>
                      <button className="subdisc-group-head" onClick={() => setOpenGroup(isOpen ? '__none__' : grp)}>
                        <span className="sg-name">{grp}</span>
                        <span className="sg-count">{items.length}</span>
                        <i className="fa-solid fa-chevron-down sg-caret"></i>
                      </button>
                      {isOpen && renderSubItems(items)}
                    </div>
                  );
                })}
              </div>
            ) : (
              renderSubItems(subDisciplines)
            )
          )}
          {displayResults.length > 0 ? (<>
          <div className="results-table-container">
            <div className={`results-table-header ${hasInner ? '' : 'no-inner'}`}>
              <div className="rt-col rt-rank">RANK</div><div className="rt-col rt-athlete">{teamView ? 'TEAM' : 'ATHLETE'}</div><div className="rt-col rt-spacer"></div>
              <div className="rt-col rt-fed">FED</div><div className="rt-col rt-series">{teamView ? 'MEMBERS' : 'SERIES'}</div><div className="rt-col rt-total">TOTAL</div>{hasInner && <div className="rt-col rt-inner">INNER<br />10S</div>}
            </div>
            {pagedResults.map((r, i) => {
              const gi = (resultsPage - 1) * PER_PAGE + i;
              const medals = ['medal-gold', 'medal-silver', 'medal-bronze'];
              const medalClass = gi < 3 ? `medal-row ${medals[gi]}` : '';
              // Реальное число серий (6 для 60 выстрелов, 5 для скита-125 и т.д.), без обрезки
              const shotsRaw = (Array.isArray(r.shots) ? r.shots : []).filter((s) => s != null && s !== '');
              const expanded = expandedId === r.id;
              const detail = shotCache[r.id];
              // Размер серии для разворота берём из числа серий результата: 125 выстрелов / 5 серий = 25
              // (шотган, раунды по 25), 60 / 6 = 10 (винтовка). Тогда S-метки совпадают с рядом серий.
              const grpSize = detail && detail.length ? Math.max(1, Math.round(detail.length / (shotsRaw.length || 1))) : 10;
              return (
                <Fragment key={r.id || r.athleteName}>
                <div className={`results-table-row ${medalClass} ${hasInner ? '' : 'no-inner'} ${canExpand(r) ? 'row-clickable' : ''} ${expanded ? 'row-expanded' : ''}`} onClick={() => toggleShots(r)}>
                  <div className="rt-col rt-rank">{gi < 3 ? <img src={`/img/${['First', 'Second', 'Third'][gi]}_results.png`} className="rank-medal" alt="" /> : <span className="rank-num">{gi + 1}</span>}</div>
                  <div className="rt-col rt-athlete"><span className="athlete-name">{r.athleteName}</span>{canExpand(r) && <span className="expand-caret">{expanded ? '▾' : '▸'}</span>}</div>
                  <div className="rt-col rt-spacer"></div>
                  <div className="rt-col rt-fed">{flagFor(r.federationCode) && <img src={flagFor(r.federationCode)} className="fed-flag-img" alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}<span>{r.federationCode}</span></div>
                  <div className="rt-col rt-series">{r.isTeam
                    ? <div className="team-members">{shotsRaw.join(' · ')}</div>
                    : <div className="shots-container"><div className="shots-row">{shotsRaw.length ? shotsRaw.map((s, si) => <span key={si} className={`shot ${getShotClass(s)}`}>{s}</span>) : <span className="shot shot-miss">•</span>}</div></div>}</div>
                  <div className="rt-col rt-total"><span className={`total-value ${gi === 0 ? 'gold-value' : ''}`}>{r.total}</span></div>
                  {hasInner && <div className="rt-col rt-inner"><span className={`inner-value ${gi === 0 ? 'gold-value' : ''}`}>{r.inner10s}</span></div>}
                </div>
                {expanded && canExpand(r) && (
                  <div className="shots-detail-row">
                    {detail === undefined ? <span className="shots-detail-msg">Loading shot-by-shot…</span>
                      : detail.length ? (
                        <div className="shots-detail">
                          {groupShots(detail, shotsRaw, grpSize).map((grp, si) => (
                            <div className="sd-series" key={si}>
                              <span className="sd-label">S{si + 1}</span>
                              {grp.map((s, k) => <span key={k} className={`shot ${getSingleShotClass(s)}`}>{String(s).trim()}</span>)}
                            </div>
                          ))}
                        </div>
                      ) : <span className="shots-detail-msg">No shot-by-shot data for this result.</span>}
                  </div>
                )}
                </Fragment>
              );
            })}
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
            {/* Только официальный источник: per-view SIUS-ранклист (OFFICIAL PDF), когда у события нет
                приложенного result-book. Если книги есть — они списком ниже. Экспорт нашей таблицы убран
                (ссылаемся только на официальные документы). */}
            {selectedEventBooks.length === 0 && officialPdfUrl && (
              <button className="download-pdf-btn" onClick={() => window.open(officialPdfUrl, '_blank', 'noopener')}>
                <i className="fa-solid fa-download"></i> OFFICIAL PDF
              </button>
            )}
          </div>

          {/* Целые официальные result-book события — единый источник официального PDF (1 или несколько
              частей, все отдельными файлами). Когда они есть, отдельная кнопка «OFFICIAL PDF» убрана. */}
          {selectedEventBooks.length > 0 && (
            <div className="results-archive-list" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.6)', margin: '2px 2px 8px' }}>
                Official result book{selectedEventBooks.length > 1 ? 's' : ''} · PDF
              </div>
              {selectedEventBooks.map((f, i) => {
                const ft = fileTypeMeta(f.file, f.name);
                return (
                  <div className="results-archive-item" key={i}>
                    <i className={`fa-solid ${ft.icon} results-archive-icon`} style={{ color: ft.color }}></i>
                    <div className="results-archive-info">
                      <span className="results-archive-name">{f.name}</span>
                      <span className="results-archive-meta">{f.fileSize || ft.label}</span>
                    </div>
                    <button className="results-archive-btn" onClick={() => previewFile(f.file)} title="Open in browser"><i className="fa-solid fa-eye"></i> Preview</button>
                    <button className="results-archive-btn results-archive-btn-dl" onClick={() => downloadResultFile(f.name, f.file)} title="Download"><i className="fa-solid fa-download"></i> {ft.label}</button>
                  </div>
                );
              })}
            </div>
          )}

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
          <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC EUROPEAN RANKING</span></div>
          <h2 className="discipline-title">SELECT A DISCIPLINE</h2>
          <p className="discipline-desc">Choose a discipline to view the European ranking</p>
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
          <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC EUROPEAN RANKING</span></div>
          <div className="rankings-detail-topbar">
            <h2 className="rankings-detail-title">{selectedDiscipline.toUpperCase()}{rankingsGender !== 'ALL' ? ` — ${rankingsGender}` : ''}</h2>
            <div className="records-pdf-btns">
              {(rankingsGender === 'ALL' ? ['MEN', 'WOMEN'] : [rankingsGender]).map((g) => {
                const pdf = OFFICIAL_RANKING_PDF[`${selectedDiscipline}|${g}`];
                return pdf ? (
                  <a key={g} className="export-btn export-btn-sec" href={pdf} target="_blank" rel="noopener noreferrer">
                    <i className="fa-solid fa-file-pdf"></i> OFFICIAL PDF{rankingsGender === 'ALL' ? ` · ${g}` : ''}
                  </a>
                ) : null;
              })}
            </div>
          </div>
          <div className="rankings-table-container">
            <div className="rankings-table-header rankings-grid">
              <div className="rt-col rt-rank">RANK</div>
              <div className="rt-col rt-athlete">NAME</div>
              <div className="rt-col rt-fed">NATION</div>
              <div className="rt-col rt-yob">YEAR OF BIRTH</div>
            </div>
            {displayRankings.length > 0 ? pagedRankings.map((r, i) => {
              const gi = (rankingsPage - 1) * PER_PAGE + i;
              const pos = r.position || (gi + 1);
              const medals = ['medal-row medal-gold', 'medal-row medal-silver', 'medal-row medal-bronze'];
              const medalClass = pos <= 3 ? medals[pos - 1] : '';
              const flag = recordFlagFor(r.country);
              return (
                <div key={r.id || `${r.athleteName}-${gi}`} className={`rankings-table-row rankings-grid ${medalClass}`}>
                  <div className="rt-col rt-rank">{pos <= 3 ? <img src={`/img/${['First', 'Second', 'Third'][pos - 1]}_results.png`} className="rank-medal" alt="" /> : <span className="rank-num">{pos}</span>}</div>
                  <div className="rt-col rt-athlete"><span className="athlete-name">{r.athleteName}</span></div>
                  <div className="rt-col rt-fed">{flag && <img src={flag} className="fed-flag-img" alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}<span>{r.country}</span></div>
                  <div className="rt-col rt-yob"><span className="rank-yob">{r.yearOfBirth || '—'}</span></div>
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

      {/* RECORDS TAB — динамический: базовые дисциплины и категории строятся из самих данных. */}
      {activeTab === 'records' && (
        <>
          {/* RECORDS — LEVEL 1: выбор базовой дисциплины (динамически из данных) */}
          {!resultsLevel && (
            <section className="rankings-level">
              {rankingsFilterBar}
              <div className="discipline-header"><span className="discipline-line"></span><span className="discipline-subtitle">ESC EUROPEAN RECORDS</span></div>
              <h2 className="discipline-title">SELECT A DISCIPLINE</h2>
              <p className="discipline-desc">Choose a discipline to view European records</p>
              <div className="discipline-grid">
                {recordBases.map((b) => {
                  const [mainTok, ...subToks] = b.name.split(' ');
                  return (
                    <div key={b.name} className="discipline-card" onClick={() => { setSelectedDiscipline(b.name); setGender('ALL'); setResultsLevel(true); }}>
                      <h3 className="disc-card-title"><span className="disc-main">{mainTok}</span><span className="disc-sub">{subToks.join(' ')} · {b.count} record{b.count !== 1 ? 's' : ''}</span></h3>
                      <div className="disc-card-icon"><img src={recIcon(b.name)} alt="" /><span className="disc-card-arrow">›</span></div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* RECORDS — LEVEL 2: таблица рекордов выбранной дисциплины (все варианты + фильтр категории).
              Гейт только на detailLoading: до сюда нельзя дойти без загруженных records (карточки Level 1
              строятся из них), поэтому глобальный !loaded (ждёт огромный fetch событий) здесь не нужен. */}
          {resultsLevel && (
            detailLoading ? <LoadingResults key={`rec-${selectedDiscipline}`} variant="records" onDone={() => setDetailLoading(false)} /> : (
            <section className="results-detail">
              {rankingsFilterBar}
              <div className="results-detail-header"><span className="results-detail-line"></span><span className="results-detail-subtitle">ESC EUROPEAN RECORDS</span></div>
              <div className="results-detail-breadcrumbs" style={{ marginBottom: '16px' }}>
                <span className="rd-breadcrumb" onClick={() => { setResultsLevel(false); setGender('ALL'); }}>Records</span>
                <span className="rd-breadcrumb-sep">›</span>
                <span className="rd-breadcrumb-active">{selectedDiscipline}</span>
              </div>
              <div className="rankings-detail-topbar">
                <h2 className="rankings-detail-title">{selectedDiscipline.toUpperCase()}{gender !== 'ALL' ? ` — ${gender}` : ''}</h2>
                <select className="records-category-select" value={gender} onChange={(e) => { setGender(e.target.value); }}>
                  {recordCatOptions.map((c) => <option key={c} value={c}>{c === 'ALL' ? 'CATEGORY: ALL' : `CATEGORY: ${c}`}</option>)}
                </select>
              </div>
              <div className="rankings-table-container">
                {recordGroups.length > 0 ? (
                  <>
                    <div className="rankings-table-header records-grid">
                      <div className="rt-col">TYPE</div><div className="rt-col">ATHLETE</div>
                      <div className="rt-col rt-fed rt-hide-sm">FEDERATION</div><div className="rt-col">RECORD</div><div className="rt-col rt-hide-sm">LOCATION</div><div className="rt-col rt-hide-sm">DATE</div>
                    </div>
                    {recordGroups.map(([disc, list]) => (
                      <Fragment key={disc}>
                        {/* Подзаголовок полной дисциплины — как в официальном PDF (вместо подписи у имени). */}
                        <div className="records-subhead">{disc}</div>
                        {list.map((r, i) => {
                          const flag = recordFlagFor(r.federationCode);
                          const members = String(r.athleteName || '').split(' / ');
                          const isTeam = members.length > 1;               // командный рекорд — состав через " / "
                          const rkey = r.id || `${disc}-${i}`;
                          const expanded = expandedRec === rkey;
                          return (
                          <Fragment key={rkey}>
                            <div className={`rankings-table-row records-grid ${isTeam ? 'row-clickable' : ''} ${expanded ? 'row-expanded' : ''}`} onClick={isTeam ? () => setExpandedRec(expanded ? null : rkey) : undefined}>
                              <div className="rt-col"><span className="record-type">{r.type}</span></div>
                              <div className="rt-col"><span className="athlete-name">{r.athleteName}</span>{isTeam && <span className="expand-caret">{expanded ? '▾' : '▸'}</span>}</div>
                              <div className="rt-col rt-fed rt-hide-sm">{flag && <img src={flag} className="fed-flag-img" alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}<span>{r.federationCode}</span></div>
                              <div className="rt-col"><span className="record-value">{r.record}</span></div>
                              <div className="rt-col rt-hide-sm"><span className="record-location">{r.location}</span></div>
                              <div className="rt-col rt-hide-sm"><span className="record-date">{formatDate(r.date)}</span></div>
                            </div>
                            {isTeam && expanded && (
                              <div className="rec-members-row">
                                {members.map((m, k) => <span key={k} className="rec-member"><i className="fa-solid fa-user rec-member-icon"></i>{m}</span>)}
                              </div>
                            )}
                          </Fragment>
                          );
                        })}
                      </Fragment>
                    ))}
                  </>
                ) : (
                  <div className="rt-empty">
                    <i className="fa-solid fa-trophy rt-empty-icon"></i>
                    <p className="rt-empty-title">No records set yet</p>
                    <p className="rt-empty-text">No records have been registered for this discipline and category yet.</p>
                  </div>
                )}
              </div>
              {/* Легенда типов рекордов — как в официальном PDF. */}
              {recordGroups.length > 0 && (
                <div className="records-legend">
                  {RECORD_TYPE_LEGEND.map(([code, name]) => (
                    <span key={code} className="records-legend-item"><b>{code}</b> {name}</span>
                  ))}
                </div>
              )}
            </section>
            )
          )}
        </>
      )}
    </>
  );
};

export default ResultsRankingsPage;