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

    const handleDetails = (event) => {
        if (event.slug) {
            router.push(`/events/${event.slug}`);
        }
    };
    
    const handleResults = (event) => {
        router.push(`/results`);
    };

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
                                            onClick={() => { setFilterMonth('all'); setCurrentPage(1); }}>ALL</button>
                                        {months.map((m) => (
                                            <button key={m.value} className={`epc-date-option ${filterMonth === m.value ? 'epc-active' : ''}`}
                                                onClick={() => { setFilterMonth(m.value); setCurrentPage(1); }}>{m.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="epc-date-dropdown-section">
                                    <span className="epc-date-dropdown-label">Year</span>
                                    <div className="epc-date-dropdown-grid">
                                        {years.map((y) => (
                                            <button key={y} className={`epc-date-option ${filterYear === y ? 'epc-active' : ''}`}
                                                onClick={() => { setFilterYear(y); setCurrentPage(1); }}>{y === 'all' ? 'ALL' : y}</button>
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
                            return (
                                <div className="epc-featured-card" key={event.id} onClick={() => handleDetails(event)}>
                                    {imgUrl && <img src={imgUrl} alt={event.name} />}
                                    <span className="epc-status">{event.statusEvent || 'UPCOMING'}</span>
                                    <div className="epc-featured-content">
                                        <div className="epc-featured-tags">
                                            <span className="epc-tag epc-tag-accent">{event.category || 'SENIOR'}</span>
                                            <span className="epc-tag epc-tag-gray">{event.type || 'CHAMPIONSHIP'}</span>
                                        </div>
                                        <h3 className="epc-featured-event-title">{event.name}</h3>
                                        <div className="epc-featured-details">
                                            <i className="fa-solid fa-location-dot"></i>
                                            <span>{event.location}</span>
                                            <span>{formatDate(new Date(event.date))}</span>
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
                        const { name, date, location, statusEvent, type, slug } = event;
                        const isFinished = statusEvent === 'FINISHED';
                        const eventDate = new Date(date);
                        const endDate = new Date(eventDate);
                        endDate.setDate(endDate.getDate() + 2);

                        return (
                            <div className="epc-events-table-row" key={event.id}>
                                <div className="epc-col epc-col-date">
                                    <span className="epc-date-range">{formatDate(eventDate)} - {formatDate(endDate)}</span>
                                    <span className="epc-date-year">{eventDate.getFullYear()}</span>
                                </div>
                                <div className="epc-col epc-col-event">
                                    <span className="epc-event-name">{name}</span>
                                </div>
                                <div className="epc-col epc-col-location">
                                    <i className="fa-solid fa-location-dot"></i>
                                    <span>{location}</span>
                                </div>
                                <div className="epc-col epc-col-type">
                                    <span className="epc-type-tag">{type || 'CHAMPIONSHIP'}</span>
                                </div>
                                <div className="epc-col epc-col-status">
                                    <span className={`epc-status-tag ${isFinished ? 'epc-finished' : 'epc-upcoming'}`}>{statusEvent}</span>
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