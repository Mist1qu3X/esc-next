'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
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

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(
                    `${config.API_URL}/api/events?populate=*&sort=date:asc&pagination[limit]=100`
                );
                setEvents(res.data.data);
            } catch (e) { console.error(e); }
        };
        fetchEvents();
    }, []);

    // Фильтрация
    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.date);
        const matchType = filterType === 'all' || event.type?.toLowerCase() === filterType;
        const matchStatus = filterStatus === 'all' || event.statusEvent?.toLowerCase() === filterStatus;
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

    const handleDetails = (event) => console.log('DETAILS', event.name);
    const handleResults = (event) => console.log('RESULTS', event.name);

    const formatDate = (d) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const featuredEvents = filteredEvents.slice(0, 2);

    const currentMonthLabel = filterMonth === 'all' ? '' : months.find(m => m.value === filterMonth)?.label;
    const currentYearLabel = filterYear === 'all' ? '' : filterYear;
    const dateButtonLabel = filterMonth === 'all' && filterYear === 'all'
        ? 'DATE ▼'
        : `${currentMonthLabel} ${currentYearLabel} ▼`;

    return (
        <>
            {/* ========== EVENTS CALENDAR ========== */}
            <section className="events-calendar">
                <div className="breadcrumbs-row">
                    <span className="breadcrumb-home">HOME</span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-active">EVENTS</span>
                </div>
                <div className="next-layer">
                    <span className="breadcrumb-line"></span>
                    <span className="breadcrumb-subtitle">COMPETITION SCHEDULE</span>
                </div>
                <div className="title-row">
                    <h1>EVENTS CALENDAR</h1>
                    <span className="events-count">{filteredEvents.length} EVENTS</span>
                </div>
                <div className="new-section-line"></div>

                <div className="filter">
                    <i className="fa-solid fa-filter filter-icon"></i>
                    <span className="filter-label">FILTER:</span>

                    {/* Фильтр даты с выпадашкой */}
                    <div className="date-filter-wrapper">
                        <button className="filter-btn date-event" onClick={() => setShowDateFilter(!showDateFilter)}>
                            {dateButtonLabel}
                        </button>
                        {showDateFilter && (
                            <div className="date-dropdown">
                                <div className="date-dropdown-section">
                                    <span className="date-dropdown-label">Month</span>
                                    <div className="date-dropdown-grid">
                                        <button className={`date-option ${filterMonth === 'all' ? 'active' : ''}`}
                                            onClick={() => { setFilterMonth('all'); setCurrentPage(1); }}>ALL</button>
                                        {months.map((m) => (
                                            <button key={m.value} className={`date-option ${filterMonth === m.value ? 'active' : ''}`}
                                                onClick={() => { setFilterMonth(m.value); setCurrentPage(1); }}>{m.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="date-dropdown-section">
                                    <span className="date-dropdown-label">Year</span>
                                    <div className="date-dropdown-grid">
                                        {years.map((y) => (
                                            <button key={y} className={`date-option ${filterYear === y ? 'active' : ''}`}
                                                onClick={() => { setFilterYear(y); setCurrentPage(1); }}>{y === 'all' ? 'ALL' : y}</button>
                                        ))}
                                    </div>
                                </div>
                                <button className="date-apply-btn" onClick={() => setShowDateFilter(false)}>APPLY</button>
                            </div>
                        )}
                    </div>
                    <span className="filter-divider"></span>

                    <div className="filter-group">
                        {types.map((t) => (
                            <button key={t} className={`filter-btn ${filterType === t ? 'selected-filter' : 'unselected-filter'}`}
                                onClick={() => { setFilterType(t); setCurrentPage(1); }}>
                                {t.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <span className="filter-divider"></span>

                    <div className="filter-group">
                        {statuses.map((s) => (
                            <button key={s} className={`filter-btn ${filterStatus === s ? 'selected-filter' : 'unselected-filter'}`}
                                onClick={() => { setFilterStatus(s); setCurrentPage(1); }}>
                                {s.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className={`filter-search-wrapper ${searchActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-magnifying-glass search-icon-filter" onClick={() => setSearchActive(!searchActive)}></i>
                        <input type="text" className="filter-search-input" placeholder="Search events..."
                            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            onKeyDown={(e) => e.key === 'Escape' && setSearchActive(false)} />
                    </div>
                </div>
            </section>

            {/* ========== FEATURED EVENTS ========== */}
            {featuredEvents.length > 0 && (
                <section className="featured-events">
                    <div className="next-layer">
                        <span className="breadcrumb-line"></span>
                        <span className="breadcrumb-subtitle">FEATURED EVENTS</span>
                    </div>
                    <div className="featured-container">
                        {featuredEvents.map((event) => {
                            const imgUrl = event.image?.url?.startsWith('http') ? event.image.url : `${config.API_URL}${event.image?.url}`;
                            return (
                                <div className="featured-card" key={event.id}>
                                    {imgUrl && <img src={imgUrl} alt={event.name} />}
                                    <span className="status">{event.statusEvent || 'UPCOMING'}</span>
                                    <div className="featured-content">
                                        <div className="featured-tags">
                                            <span className="tag tag-accent">{event.category || 'SENIOR'}</span>
                                            <span className="tag tag-gray">{event.type || 'CHAMPIONSHIP'}</span>
                                        </div>
                                        <h3 className="featured-event-title">{event.name}</h3>
                                        <div className="featured-details">
                                            <i className="fa-solid fa-location-dot"></i>
                                            <span>{event.location}</span>
                                            <span>{formatDate(new Date(event.date))}</span>
                                        </div>
                                        <button className="featured-view-btn" onClick={() => handleDetails(event)}>VIEW EVENT &gt;</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ========== ALL EVENTS ========== */}
            <section className="all-events">
                <div className="all-events-naming">
                    <div className="all-events-line"></div>
                    <p className="all-events-title">ALL EVENTS</p>
                    <div className="all-events-spacer"></div>
                    <span className="all-events-count">{filteredEvents.length} EVENTS</span>
                </div>

                <div className="events-table-wrapper">
                    <div className="events-table-header">
                        <div className="col col-date">DATES</div>
                        <div className="col col-event">EVENT</div>
                        <div className="col col-location">LOCATION</div>
                        <div className="col col-type">TYPE</div>
                        <div className="col col-status">STATUS</div>
                        <div className="col col-actions">ACTIONS</div>
                    </div>

                    {currentEvents.map((event) => {
                        const { name, date, location, statusEvent, type } = event;
                        const isFinished = statusEvent === 'FINISHED';
                        const eventDate = new Date(date);
                        const endDate = new Date(eventDate);
                        endDate.setDate(endDate.getDate() + 2);

                        return (
                            <div className="events-table-row" key={event.id}>
                                <div className="col col-date">
                                    <span className="date-range">{formatDate(eventDate)} - {formatDate(endDate)}</span>
                                    <span className="date-year">{eventDate.getFullYear()}</span>
                                </div>
                                <div className="col col-event">
                                    <span className="event-name">{name}</span>
                                </div>
                                <div className="col col-location">
                                    <i className="fa-solid fa-location-dot"></i>
                                    <span>{location}</span>
                                </div>
                                <div className="col col-type">
                                    <span className="type-tag">{type || 'CHAMPIONSHIP'}</span>
                                </div>
                                <div className="col col-status">
                                    <span className={`status-tag ${isFinished ? 'finished' : 'upcoming'}`}>{statusEvent}</span>
                                </div>
                                <div className="col col-actions">
                                    <button className="action-btn details-btn" onClick={() => handleDetails(event)}>DETAILS</button>
                                    {isFinished && (
                                        <button className="action-btn results-btn" onClick={() => handleResults(event)}>RESULTS</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                            onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                    ))}
                    {currentPage < totalPages && (
                        <button className="page-btn next" onClick={() => setCurrentPage(currentPage + 1)}>NEXT &gt;</button>
                    )}
                </div>
            </section>
        </>
    );
};

export default EventsPageContent;