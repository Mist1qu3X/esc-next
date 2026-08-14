'use client';
import { useState, useEffect } from 'react';
import { cachedGet } from '@/lib/apiCache';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import Pagination from '@/components/Pagination/Pagination';
import './EventsPageContent.css';

// Фолбэк-вкладки фильтра типа (коллекция event-category откатана на проде)
const DEFAULT_CATEGORIES = [
    { label: 'COMPETITIONS', matchTypes: 'championship,competition,cup,league,grand prix,open,masters,memorial,final' },
    { label: 'EDUCATION', matchTypes: 'education,course,seminar' },
    { label: 'MEETINGS', matchTypes: 'meeting,assembly,congress,workshop' },
];

const STATUS_CLASS = {
    UPCOMING: 'epc-upcoming', ONGOING: 'epc-ongoing', FINISHED: 'epc-finished',
};
const STATUS_LABEL = {
    UPCOMING: 'UPCOMING', ONGOING: 'IN PROGRESS', FINISHED: 'FINISHED',
};

const EventsPageContent = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories] = useState(DEFAULT_CATEGORIES);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchActive, setSearchActive] = useState(false);
    const [openFilter, setOpenFilter] = useState(null); // какой дропдаун открыт (month/year)
    const [currentPage, setCurrentPage] = useState(1);
    const [showSegments, setShowSegments] = useState(true);
    const eventsPerPage = 6;
    const router = useRouter();

    const parseDate = (dateString) => {
        if (!dateString) return new Date(NaN);
        if (dateString.includes('-')) return new Date(dateString);
        const parts = dateString.split('/');
        if (parts.length !== 3) return new Date(NaN);
        const first = parseInt(parts[0], 10), second = parseInt(parts[1], 10), year = parseInt(parts[2], 10);
        if (first > 12) return new Date(year, second - 1, first);
        if (second > 12) return new Date(year, first - 1, second);
        return new Date(year, first - 1, second);
    };

    // Статус по датам: предстоит / идёт / завершено
    const getStatus = (event) => {
        const start = parseDate(event.date);
        if (isNaN(start.getTime())) return 'UPCOMING';
        const startDay = new Date(start); startDay.setHours(0, 0, 0, 0);
        const endRaw = event.endDate ? parseDate(event.endDate) : start;
        const endDay = new Date(isNaN(endRaw.getTime()) ? start : endRaw); endDay.setHours(23, 59, 59, 999);
        const now = new Date();
        if (now < startDay) return 'UPCOMING';
        if (now <= endDay) return 'ONGOING';
        return 'FINISHED';
    };

    const formatDisplayDate = (dateString) => {
        const date = parseDate(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const getYearFromDate = (dateString) => {
        const date = parseDate(dateString);
        return isNaN(date.getTime()) ? null : date.getFullYear();
    };
    const getMonthShort = (dateString) => {
        const date = parseDate(dateString);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    };
    const getDayRange = (startStr, endStr) => {
        const s = parseDate(startStr);
        if (isNaN(s.getTime())) return '';
        const e = endStr ? parseDate(endStr) : null;
        if (!e || isNaN(e.getTime()) || e.getTime() === s.getTime()) return `${s.getDate()}`;
        if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) return `${s.getDate()}-${e.getDate()}`;
        const eMonth = e.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        return <>{s.getDate()}-<span className="epc-date-month">{eMonth}</span> {e.getDate()}</>;
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const url = (page) => `${config.API_URL}/api/events?populate[image]=true&sort=date:desc&pagination[pageSize]=100&pagination[page]=${page}`;
                const first = await cachedGet(url(1));
                setEvents(first.data?.data || []);
                setLoading(false);
                const pageCount = first.data?.meta?.pagination?.pageCount || 1;
                for (let page = 2; page <= pageCount; page++) {
                    const res = await cachedGet(url(page));
                    const batch = res.data?.data || [];
                    if (batch.length) setEvents((prev) => [...prev, ...batch]);
                }
            } catch (e) { console.error(e); setLoading(false); }
        };
        fetchEvents();
    }, []);

    // Закрытие дропдаунов по клику вне
    useEffect(() => {
        const onDown = (e) => { if (!e.target.closest('[data-dd]')) setOpenFilter(null); };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    const activeMatch = filterType === 'all'
        ? null
        : (categories.find((c) => c.label === filterType)?.matchTypes || '')
            .split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

    const filteredEvents = events.filter((event) => {
        const eventDate = parseDate(event.date);
        const matchType = !activeMatch || activeMatch.some((m) => (event.type || '').toLowerCase().includes(m));
        const matchStatus = filterStatus === 'all' || getStatus(event).toLowerCase() === filterStatus;
        const matchMonth = filterMonth === 'all' || eventDate.getMonth() === parseInt(filterMonth);
        const matchYear = filterYear === 'all' || eventDate.getFullYear() === parseInt(filterYear);
        const matchSearch = !searchTerm || event.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchStatus && matchMonth && matchYear && matchSearch;
    });

    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    const currentEvents = filteredEvents.slice((currentPage - 1) * eventsPerPage, currentPage * eventsPerPage);

    const months = [
        { value: '0', label: 'JAN' }, { value: '1', label: 'FEB' }, { value: '2', label: 'MAR' },
        { value: '3', label: 'APR' }, { value: '4', label: 'MAY' }, { value: '5', label: 'JUN' },
        { value: '6', label: 'JUL' }, { value: '7', label: 'AUG' }, { value: '8', label: 'SEP' },
        { value: '9', label: 'OCT' }, { value: '10', label: 'NOV' }, { value: '11', label: 'DEC' },
    ];
    const yearValues = Array.from(new Set(events.map((e) => parseDate(e.date).getFullYear()).filter((y) => !isNaN(y)))).sort((a, b) => b - a);

    // Type / Status — кнопки-группы (как в макете); Month / Year — дропдауны
    const types = ['all', ...categories.map((c) => c.label)];
    const statuses = ['all', 'upcoming', 'finished'];
    const monthOptions = [{ value: 'all', label: 'ALL MONTHS' }, ...months];
    const yearOptions = [{ value: 'all', label: 'ALL YEARS' }, ...yearValues.map((y) => ({ value: String(y), label: String(y) }))];

    const renderDropdown = (id, value, options, onChange) => {
        const current = options.find((o) => o.value === value) || options[0];
        return (
            <div className="epc-dd" data-dd>
                <button type="button" className={`epc-filter-btn epc-dd-btn ${openFilter === id ? 'epc-open' : ''} ${value !== 'all' ? 'epc-dd-set' : ''}`}
                    onClick={() => setOpenFilter(openFilter === id ? null : id)}>
                    <span>{current.label}</span>
                    <i className="fa-solid fa-chevron-down epc-dd-caret"></i>
                </button>
                {openFilter === id && (
                    <div className="epc-dd-menu">
                        {options.map((o) => (
                            <button type="button" key={o.value}
                                className={`epc-dd-opt ${value === o.value ? 'epc-active' : ''}`}
                                onClick={() => { onChange(o.value); setOpenFilter(null); setCurrentPage(1); }}>
                                {o.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const handleDetails = (event) => { if (event.slug) router.push(`/events/${event.slug}`); };
    const handleResults = (event) => { if (event.slug) router.push(`/events/${event.slug}`); };

    // FEATURED — идущие сейчас первыми, затем ближайшие предстоящие
    const byDateAsc = (a, b) => parseDate(a.date) - parseDate(b.date);
    const ongoingAll = filteredEvents.filter((e) => getStatus(e) === 'ONGOING').sort(byDateAsc);
    const upcomingAll = filteredEvents.filter((e) => getStatus(e) === 'UPCOMING').sort(byDateAsc);
    const featuredEvents = [...ongoingAll, ...upcomingAll, ...filteredEvents].filter((e, i, arr) => arr.indexOf(e) === i).slice(0, 4);

    // SEASON PROGRESS — доля завершённых событий текущего года (реальные цифры)
    const seasonYear = new Date().getFullYear();
    const seasonEvents = events.filter((e) => parseDate(e.date).getFullYear() === seasonYear);
    const seasonDone = seasonEvents.filter((e) => getStatus(e) === 'FINISHED').length;
    const seasonProgress = seasonEvents.length ? Math.round((seasonDone / seasonEvents.length) * 100) : 0;

    // Сегменты сезона = группы дисциплин. Логика по реальным событиям:
    // done — все события группы уже прошли (дисциплина завершена); active — текущая/ближайшая
    // (одна на весь сезон); pending — впереди; empty — событий группы в этом сезоне нет.
    const SEGMENT_DEFS = [
        { label: '10m Rifle & Pistol', match: ['10m', 'air rifle', 'air pistol', 'air weapon'] },
        { label: '25m / 50m / 300m', match: ['25m', '50m', '300m', 'rapid fire', '3 position', '3x40', '3x20'] },
        { label: 'Moving Target', match: ['moving', 'running target'] },
        { label: 'Shotgun', match: ['shotgun', 'trap', 'skeet'] },
        { label: 'Youth Events', match: ['u-', 'u18', 'u21', 'u23', 'junior', 'youth'] },
        { label: 'ESC Leagues', match: ['league', 'final', 'cup', 'grand prix'] },
    ];
    const segText = (e) => `${e.name || ''} ${e.type || ''} ${e.disciplines || ''}`.toLowerCase();
    // Для каждой дисциплины считаем реальную долю завершённых событий (finished / total)
    // Каждая дисциплина — свой мини-прогресс-бар: заливка = доля завершённых событий (finished/total).
    // Порядок фиксированный (как в SEGMENT_DEFS), без сортировки.
    const seasonSegments = SEGMENT_DEFS.map((seg) => {
        const matched = seasonEvents.filter((e) => seg.match.some((m) => segText(e).includes(m)));
        const total = matched.length;
        const finished = matched.filter((e) => getStatus(e) === 'FINISHED').length;
        const ongoing = matched.some((e) => getStatus(e) === 'ONGOING');
        return { label: seg.label, match: seg.match, empty: total === 0, total, finished, ratio: total ? finished / total : 0, done: total > 0 && finished === total, ongoing };
    });
    // Неактивные дисциплины (без событий) — в конец; активные сохраняют исходный порядок (стабильная сортировка)
    seasonSegments.sort((a, b) => (a.empty ? 1 : 0) - (b.empty ? 1 : 0));
    const nonEmptySegs = seasonSegments.filter((s) => !s.empty);
    const totalSegments = nonEmptySegs.length || seasonSegments.length;
    const doneSegments = nonEmptySegs.filter((s) => s.done).length; // полностью завершённые дисциплины

    // ON THE RANGE — реальное идущее событие (иначе — ближайшее предстоящее)
    const liveEvent = events.filter((e) => getStatus(e) === 'ONGOING').sort(byDateAsc)[0] || null;
    const nextEvent = events.filter((e) => getStatus(e) === 'UPCOMING').sort(byDateAsc)[0] || null;
    // Активная дисциплина = та, к которой относится событие-в-фокусе (то же, что в блоке ниже) → её подпись жирная
    const spotlight = liveEvent || nextEvent;
    if (spotlight) {
        const cur = seasonSegments.find((s) => !s.empty && s.match.some((m) => segText(spotlight).includes(m)));
        if (cur) cur.current = true;
    }

    return (
        <>
            <section className="epc-events-calendar">
                <div className="epc-breadcrumbs-row">
                    <span className="epc-breadcrumb-home">HOME</span>
                    <span className="epc-breadcrumb-separator">›</span>
                    <span className="epc-breadcrumb-active">EVENTS</span>
                </div>
                <div className="epc-title-row">
                    <h1>EVENTS CALENDAR</h1>
                    <span className="epc-events-count">{filteredEvents.length} EVENTS</span>
                </div>
                <div className="epc-new-section-line"></div>

                <div className={`epc-filter ${searchActive ? 'epc-searching' : ''}`}>
                    <i className="fa-solid fa-filter epc-filter-icon"></i>
                    <span className="epc-filter-label">FILTER:</span>
                    {renderDropdown('month', filterMonth, monthOptions, setFilterMonth)}
                    {renderDropdown('year', filterYear, yearOptions, setFilterYear)}
                    <span className="epc-filter-divider"></span>

                    <div className="epc-filter-group">
                        {types.map((t) => (
                            <button key={t} className={`epc-filter-btn ${filterType === t ? 'epc-selected-filter' : 'epc-unselected-filter'}`}
                                onClick={() => { setFilterType(t); setCurrentPage(1); }}>
                                {t === 'all' ? 'ALL TYPES' : t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <span className="epc-filter-divider"></span>

                    <div className="epc-filter-group">
                        {statuses.map((s) => (
                            <button key={s} className={`epc-filter-btn ${filterStatus === s ? 'epc-selected-filter' : 'epc-unselected-filter'}`}
                                onClick={() => { setFilterStatus(s); setCurrentPage(1); }}>
                                {s === 'all' ? 'ALL STATUSES' : s.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className={`epc-filter-search-wrapper ${searchActive ? 'epc-active' : ''}`}>
                        <i className="fa-solid fa-magnifying-glass epc-search-icon-filter" onClick={() => setSearchActive(!searchActive)}></i>
                        <input type="text" className="epc-filter-search-input" placeholder="Search events..."
                            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            onKeyDown={(e) => e.key === 'Escape' && setSearchActive(false)} />
                    </div>
                </div>
            </section>

            {loading ? (
              <>
                <section className="epc-featured-events">
                  <div className="epc-featured-container">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div className="epc-featured-card skeleton-card" key={i} style={{ width: 320, height: 340, flex: '0 0 320px', borderRadius: 8, overflow: 'hidden' }}>
                        <div className="skeleton" style={{ height: 150 }}></div>
                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div className="skeleton" style={{ width: 68, height: 18, borderRadius: 3 }}></div>
                            <div className="skeleton" style={{ width: 90, height: 18, borderRadius: 3 }}></div>
                          </div>
                          <div className="skeleton" style={{ width: '85%', height: 18, borderRadius: 3 }}></div>
                          <div className="skeleton" style={{ width: '60%', height: 13, borderRadius: 3 }}></div>
                          <div className="skeleton" style={{ width: 120, height: 34, borderRadius: 4, marginTop: 6 }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="epc-all-events">
                  <div className="epc-events-table-wrapper">
                    <div className="epc-events-table-header">
                      <div className="epc-col epc-col-date">DATES</div>
                      <div className="epc-col epc-col-event">EVENT</div>
                      <div className="epc-col epc-col-location">LOCATION</div>
                      <div className="epc-col epc-col-type">TYPE</div>
                      <div className="epc-col epc-col-status">STATUS</div>
                      <div className="epc-col epc-col-actions">ACTIONS</div>
                    </div>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div className="epc-events-table-row" key={i}>
                        <div className="epc-col epc-col-date"><div className="skeleton" style={{ width: 46, height: 40, borderRadius: 4 }}></div></div>
                        <div className="epc-col epc-col-event"><div className="skeleton" style={{ width: '80%', height: 15, borderRadius: 3 }}></div></div>
                        <div className="epc-col epc-col-location"><div className="skeleton" style={{ width: '70%', height: 13, borderRadius: 3 }}></div></div>
                        <div className="epc-col epc-col-type"><div className="skeleton" style={{ width: 60, height: 20, borderRadius: 3 }}></div></div>
                        <div className="epc-col epc-col-status"><div className="skeleton" style={{ width: 72, height: 20, borderRadius: 3 }}></div></div>
                        <div className="epc-col epc-col-actions"><div className="skeleton" style={{ width: 80, height: 30, borderRadius: 4 }}></div></div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (<>
            {/* ========== FEATURED EVENTS ========== */}
            {featuredEvents.length > 0 && (
                <section className="epc-featured-events">
                    <div className="epc-next-layer">
                        <span className="epc-breadcrumb-line"></span>
                        <span className="epc-breadcrumb-subtitle">FEATURED EVENTS</span>
                    </div>
                    <div className="epc-featured-container">
                        {featuredEvents.map((event) => {
                            const rawImg = event.image?.url || event.image?.data?.attributes?.url;
                            const imgUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${config.API_URL}${rawImg}`) : null;
                            return (
                                <div className="epc-featured-card" key={event.id} onClick={() => handleDetails(event)}>
                                    {imgUrl && <img src={imgUrl} alt={event.name} />}
                                    <div className="epc-featured-content">
                                        <div className="epc-featured-tags">
                                            <span className="epc-tag epc-tag-accent">{event.category || 'SENIOR'}</span>
                                            <span className="epc-tag epc-tag-gray">{event.type || 'CHAMPIONSHIP'}</span>
                                        </div>
                                        <h3 className="epc-featured-event-title">{event.name}</h3>
                                        <div className="epc-featured-details">
                                            <i className="fa-solid fa-location-dot"></i>
                                            <span>{event.location}</span>
                                            <span>{formatDisplayDate(event.date)}</span>
                                        </div>
                                        <button className="epc-featured-view-btn" onClick={(e) => { e.stopPropagation(); handleDetails(event); }}>VIEW EVENT &gt;</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ========== SEASON PROGRESS ========== */}
            <section className="epc-season-wrapper">
                <div className="epc-season-progress">
                    <div className="epc-sp-top">
                        <h2 className="epc-sp-title">SEASON {seasonYear} PROGRESS</h2>
                        {seasonEvents.length > 0 && <span className="epc-sp-percent">{seasonProgress}%</span>}
                    </div>
                    {seasonEvents.length === 0 ? (
                        <p className="epc-sp-note">No events scheduled for the {seasonYear} season yet.</p>
                    ) : (
                        <>
                            <span className="epc-sp-count">{doneSegments}/{totalSegments} SEGMENTS</span>

                            {/* Трек: каждая дисциплина — свой мини-бар, залитый на долю завершённости */}
                            <div className="epc-sp-track">
                                {seasonSegments.map((seg, i) => (
                                    <span className={`epc-sp-line ${seg.empty ? 'epc-empty' : ''}`} key={i}>
                                        {!seg.empty && <span className="epc-sp-fill" style={{ width: `${Math.round(seg.ratio * 100)}%` }}></span>}
                                    </span>
                                ))}
                            </div>

                            {/* Desktop: подписи дисциплин под треком (активная — жирная) */}
                            <div className="epc-sp-labels">
                                {seasonSegments.map((seg, i) => (
                                    <span className={`epc-sp-label ${seg.current ? 'epc-current' : ''} ${seg.empty ? 'epc-empty' : ''}`} key={i}>{seg.label}</span>
                                ))}
                            </div>

                            {/* Mobile: чек-лист (реальный статус каждой группы) */}
                            {showSegments && (
                                <ul className="epc-sp-list">
                                    {seasonSegments.map((seg, i) => (
                                        <li className={`epc-sp-item ${seg.current ? 'epc-current' : ''} ${seg.empty ? 'epc-empty' : ''}`} key={i}>
                                            <span className={`epc-sp-check ${seg.done ? 'epc-done' : ''}`}>
                                                {seg.done && <i className="fa-solid fa-check"></i>}
                                            </span>
                                            <span className="epc-sp-item-label">{seg.label}</span>
                                            {!seg.empty && <span className="epc-sp-item-frac">{seg.finished}/{seg.total}</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button className="epc-sp-toggle" onClick={() => setShowSegments(!showSegments)}>
                                SHOW SEGMENTS
                                <i className={`fa-solid ${showSegments ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                            </button>
                        </>
                    )}
                </div>
                <div className="epc-season-status">
                    {liveEvent ? (
                        <>
                            <div className="epc-ss-left">
                                <span className="epc-ss-name">{liveEvent.name}</span>
                                <span className="epc-ss-active">ACTIVE</span>
                            </div>
                            <button className="epc-ss-btn" onClick={() => handleDetails(liveEvent)}>ON THE RANGE</button>
                        </>
                    ) : nextEvent ? (
                        <>
                            <div className="epc-ss-left">
                                <span className="epc-ss-name">{nextEvent.name}</span>
                                <span className="epc-ss-next">NEXT UP · {formatDisplayDate(nextEvent.date)}</span>
                            </div>
                            <button className="epc-ss-btn" onClick={() => handleDetails(nextEvent)}>VIEW EVENT</button>
                        </>
                    ) : (
                        <div className="epc-ss-left">
                            <span className="epc-ss-name">No live events</span>
                            <span className="epc-ss-next">Check back soon</span>
                        </div>
                    )}
                </div>
            </section>

            {/* ========== ALL EVENTS ========== */}
            <section className="epc-all-events">
                <div className="epc-all-events-naming">
                    <div className="epc-all-events-line"></div>
                    <p className="epc-all-events-title">ALL EVENTS</p>
                    <div className="epc-all-events-spacer"></div>
                    <span className="epc-all-events-count">{filteredEvents.length} EVENTS</span>
                </div>

                <div className="epc-events-table-wrapper">
                    <div className="epc-events-table-header">
                        <div className="epc-col epc-col-date">DATES</div>
                        <div className="epc-col epc-col-event">EVENT</div>
                        <div className="epc-col epc-col-location">LOCATION</div>
                        <div className="epc-col epc-col-type">TYPE</div>
                        <div className="epc-col epc-col-status">STATUS</div>
                        <div className="epc-col epc-col-actions">ACTIONS</div>
                    </div>

                    {currentEvents.length > 0 ? currentEvents.map((event) => {
                        const { name, date, location, type } = event;
                        const st = getStatus(event);
                        return (
                            <div className="epc-events-table-row" key={event.id}>
                                <div className="epc-col epc-col-date">
                                    <span className="epc-date-badge">
                                        <span className="epc-date-month">{getMonthShort(date)}</span>
                                        <span className="epc-date-day">{getDayRange(date, event.endDate)}</span>
                                    </span>
                                    <span className="epc-date-year">{getYearFromDate(date)}</span>
                                </div>
                                <div className="epc-col epc-col-event">
                                    <span className="epc-event-name" title={name}>{name}</span>
                                </div>
                                <div className="epc-col epc-col-location">
                                    <i className="fa-solid fa-location-dot"></i>
                                    <span>{location}</span>
                                </div>
                                <div className="epc-col epc-col-type">
                                    <span className="epc-type-tag">{type?.toUpperCase() || 'COMPETITION'}</span>
                                </div>
                                <div className="epc-col epc-col-status">
                                    <span className={`epc-status-tag ${STATUS_CLASS[st]}`}>{STATUS_LABEL[st]}</span>
                                </div>
                                <div className="epc-col epc-col-actions">
                                    <button className="epc-action-btn epc-details-btn" onClick={() => handleDetails(event)}>DETAILS</button>
                                    {st === 'FINISHED' && (
                                        event.resultsPending
                                            ? <span className="epc-results-pending" title="Официальные результаты ещё не опубликованы">Results pending</span>
                                            : <button className="epc-action-btn epc-results-btn" onClick={() => handleResults(event)}>RESULTS</button>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="epc-events-empty">
                            <i className="fa-regular fa-calendar-xmark"></i>
                            <p>No events match your filters.</p>
                            <button className="epc-events-empty-btn" onClick={() => {
                                setFilterType('all'); setFilterStatus('all'); setFilterMonth('all'); setFilterYear('all');
                                setSearchTerm(''); setCurrentPage(1);
                            }}>Clear filters</button>
                        </div>
                    )}
                </div>

                {filteredEvents.length > 0 && <Pagination page={currentPage} pageCount={totalPages} onChange={setCurrentPage} />}
            </section>
            </>)}
        </>
    );
};

export default EventsPageContent;
