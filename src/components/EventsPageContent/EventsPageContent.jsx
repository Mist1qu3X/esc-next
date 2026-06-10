'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import './EventsPageContent.css';

const EventsPageContent = () => {
    const [events, setEvents] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchActive, setSearchActive] = useState(false);
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 6;
    const router = useRouter();

    // Универсальная функция парсинга даты
    const parseDate = (dateString) => {
        if (!dateString) return new Date(NaN);
        
        if (dateString.includes('-')) {
            return new Date(dateString);
        }
        
        const parts = dateString.split('/');
        if (parts.length !== 3) return new Date(NaN);
        
        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (first > 12) {
            return new Date(year, second - 1, first);
        }
        
        if (second > 12) {
            return new Date(year, first - 1, second);
        }
        
        return new Date(year, first - 1, second);
    };

    // Автоматическое определение статуса по дате
    const getEventStatus = (dateString) => {
        const eventDate = parseDate(dateString);
        if (isNaN(eventDate.getTime())) return 'UPCOMING';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (eventDate < today) return 'FINISHED';
        return 'UPCOMING';
    };

    // Форматирование для отображения
    const formatDisplayDate = (dateString) => {
        const date = parseDate(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getYearFromDate = (dateString) => {
        const date = parseDate(dateString);
        if (isNaN(date.getTime())) return null;
        return date.getFullYear();
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(
                    `${config.API_URL}/api/events?populate=*&sort=date:asc&pagination[limit]=100`
                );
                if (res.data?.data) {
                    // Сортировка: сначала по году (от большего к меньшему), потом по дате (от большей к меньшей)
                    const sortedEvents = [...res.data.data].sort((a, b) => {
                        const dateA = parseDate(a.date);
                        const dateB = parseDate(b.date);
                        
                        // Сначала по году (от большего к меньшему)
                        if (dateA.getFullYear() !== dateB.getFullYear()) {
                            return dateB.getFullYear() - dateA.getFullYear();
                        }
                        // Если год одинаковый - по дате от большей к меньшей (Ноябрь, Сентябрь, Июнь...)
                        return dateB - dateA;
                    });
                    setEvents(sortedEvents);
                }
            } catch (e) { console.error(e); }
        };
        fetchEvents();
    }, []);

    // Фильтрация
    const filteredEvents = events.filter((event) => {
        const eventDate = parseDate(event.date);
        const matchType = filterType === 'all' || event.type?.toLowerCase() === filterType;
        const eventStatus = getEventStatus(event.date);
        const matchStatus = filterStatus === 'all' || eventStatus.toLowerCase() === filterStatus;
        const matchMonth = filterMonth === 'all' || eventDate.getMonth() === parseInt(filterMonth);
        const matchYear = filterYear === 'all' || eventDate.getFullYear() === parseInt(filterYear);
        const matchSearch = !searchTerm || event.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchStatus && matchMonth && matchYear && matchSearch;
    });

    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    const currentEvents = filteredEvents.slice(
        (currentPage - 1) * eventsPerPage,
        currentPage * eventsPerPage
    );

    const types = ['all', 'championship', 'education', 'workshop'];
    const statuses = ['all', 'upcoming', 'finished'];
    const months = [
        { value: '0', label: 'JAN' }, { value: '1', label: 'FEB' }, { value: '2', label: 'MAR' },
        { value: '3', label: 'APR' }, { value: '4', label: 'MAY' }, { value: '5', label: 'JUN' },
        { value: '6', label: 'JUL' }, { value: '7', label: 'AUG' }, { value: '8', label: 'SEP' },
        { value: '9', label: 'OCT' }, { value: '10', label: 'NOV' }, { value: '11', label: 'DEC' },
    ];
    const currentYear = new Date().getFullYear();
    const years = ['all', currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(String);

    const handleDetails = (event) => {
        if (event.slug) {
            router.push(`/events/${event.slug}`);
        }
    };
    
    const handleResults = (event) => {
        router.push(`/results`);
    };

    const featuredEvents = filteredEvents.slice(0, 2);

    const currentMonthLabel = filterMonth === 'all' ? '' : months.find(m => m.value === filterMonth)?.label;
    const currentYearLabel = filterYear === 'all' ? '' : filterYear;
    const dateButtonLabel = filterMonth === 'all' && filterYear === 'all'
        ? 'DATE ▼'
        : `${currentMonthLabel} ${currentYearLabel} ▼`;

    return (
        <>
            {/* ========== EVENTS CALENDAR ========== */}
            <section className="epc-events-calendar">
                <div className="epc-breadcrumbs-row">
                    <span className="epc-breadcrumb-home">HOME</span>
                    <span className="epc-breadcrumb-separator">›</span>
                    <span className="epc-breadcrumb-active">EVENTS</span>
                </div>
                <div className="epc-next-layer">
                    <span className="epc-breadcrumb-line"></span>
                    <span className="epc-breadcrumb-subtitle">COMPETITION SCHEDULE</span>
                </div>
                <div className="epc-title-row">
                    <h1>EVENTS CALENDAR</h1>
                    <span className="epc-events-count">{filteredEvents.length} EVENTS</span>
                </div>
                <div className="epc-new-section-line"></div>

                <div className="epc-filter">
                    <i className="fa-solid fa-filter epc-filter-icon"></i>
                    <span className="epc-filter-label">FILTER:</span>

                    <div className="epc-date-filter-wrapper">
                        <button className="epc-filter-btn epc-date-event" onClick={() => setShowDateFilter(!showDateFilter)}>
                            {dateButtonLabel}
                        </button>
                        {showDateFilter && (
                            <div className="epc-date-dropdown">
                                <div className="epc-date-dropdown-section">
                                    <span className="epc-date-dropdown-label">Month</span>
                                    <div className="epc-date-dropdown-grid">
                                        <button className={`epc-date-option ${filterMonth === 'all' ? 'epc-active' : ''}`}
                                            onClick={() => { setFilterMonth('all'); setCurrentPage(1); setShowDateFilter(false); }}>ALL</button>
                                        {months.map((m) => (
                                            <button key={m.value} className={`epc-date-option ${filterMonth === m.value ? 'epc-active' : ''}`}
                                                onClick={() => { setFilterMonth(m.value); setCurrentPage(1); setShowDateFilter(false); }}>{m.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="epc-date-dropdown-section">
                                    <span className="epc-date-dropdown-label">Year</span>
                                    <div className="epc-date-dropdown-grid">
                                        {years.map((y) => (
                                            <button key={y} className={`epc-date-option ${filterYear === y ? 'epc-active' : ''}`}
                                                onClick={() => { setFilterYear(y); setCurrentPage(1); setShowDateFilter(false); }}>{y === 'all' ? 'ALL' : y}</button>
                                        ))}
                                    </div>
                                </div>
                                <button className="epc-date-apply-btn" onClick={() => setShowDateFilter(false)}>APPLY</button>
                            </div>
                        )}
                    </div>
                    <span className="epc-filter-divider"></span>

                    <div className="epc-filter-group">
                        {types.map((t) => (
                            <button key={t} className={`epc-filter-btn ${filterType === t ? 'epc-selected-filter' : 'epc-unselected-filter'}`}
                                onClick={() => { setFilterType(t); setCurrentPage(1); }}>
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <span className="epc-filter-divider"></span>

                    <div className="epc-filter-group">
                        {statuses.map((s) => (
                            <button key={s} className={`epc-filter-btn ${filterStatus === s ? 'epc-selected-filter' : 'epc-unselected-filter'}`}
                                onClick={() => { setFilterStatus(s); setCurrentPage(1); }}>
                                {s.toUpperCase()}
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

            {/* ========== FEATURED EVENTS ========== */}
            {featuredEvents.length > 0 && (
                <section className="epc-featured-events">
                    <div className="epc-next-layer">
                        <span className="epc-breadcrumb-line"></span>
                        <span className="epc-breadcrumb-subtitle">FEATURED EVENTS</span>
                    </div>
                    <div className="epc-featured-container">
                        {featuredEvents.map((event) => {
                            const imgUrl = event.image?.url?.startsWith('http') ? event.image.url : `${config.API_URL}${event.image?.url}`;
                            const eventStatus = getEventStatus(event.date);
                            return (
                                <div className="epc-featured-card" key={event.id} onClick={() => handleDetails(event)}>
                                    {imgUrl && <img src={imgUrl} alt={event.name} />}
                                    <span className="epc-status">{eventStatus}</span>
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

                    {currentEvents.map((event) => {
                        const { name, date, location, type, slug } = event;
                        const eventStatus = getEventStatus(date);
                        const isFinished = eventStatus === 'FINISHED';
                        const eventDate = parseDate(date);
                        const endDate = new Date(eventDate);
                        endDate.setDate(endDate.getDate() + 2);

                        return (
                            <div className="epc-events-table-row" key={event.id}>
                                <div className="epc-col epc-col-date">
                                    <span className="epc-date-range">
                                        {formatDisplayDate(date)} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="epc-date-year">{getYearFromDate(date)}</span>
                                </div>
                                <div className="epc-col epc-col-event">
                                    <span className="epc-event-name">{name}</span>
                                </div>
                                <div className="epc-col epc-col-location">
                                    <i className="fa-solid fa-location-dot"></i>
                                    <span>{location}</span>
                                </div>
                                <div className="epc-col epc-col-type">
                                    <span className="epc-type-tag">{type?.toUpperCase() || 'CHAMPIONSHIP'}</span>
                                </div>
                                <div className="epc-col epc-col-status">
                                    <span className={`epc-status-tag ${isFinished ? 'epc-finished' : 'epc-upcoming'}`}>{eventStatus}</span>
                                </div>
                                <div className="epc-col epc-col-actions">
                                    <button className="epc-action-btn epc-details-btn" onClick={() => handleDetails(event)}>DETAILS</button>
                                    {isFinished && (
                                        <button className="epc-action-btn epc-results-btn" onClick={() => handleResults(event)}>RESULTS</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="epc-pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} className={`epc-page-btn ${currentPage === i + 1 ? 'epc-active' : ''}`}
                            onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                    ))}
                    {currentPage < totalPages && (
                        <button className="epc-page-btn epc-next" onClick={() => setCurrentPage(currentPage + 1)}>NEXT &gt;</button>
                    )}
                </div>
            </section>
        </>
    );
};

export default EventsPageContent;