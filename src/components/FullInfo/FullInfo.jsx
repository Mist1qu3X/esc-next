'use client';
import React, { useState, useEffect } from 'react';
import { cachedGet } from '@/lib/apiCache';
import { useRouter } from 'next/navigation';
import './FullInfo.css';
import config from '@/lib/config';

const FullInfo = () => {
    const [events, setEvents] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [championship, setChampionship] = useState(null);
    const [platform, setPlatform] = useState(null);
    const [activeCategory, setActiveCategory] = useState('MEN');
    const [now, setNow] = useState(() => Date.now());
    const [eventsLoaded, setEventsLoaded] = useState(false);
    const router = useRouter();

    // Категории для ротации ESC RANKING (муж → жен → по кругу)
    const RANKING_CATEGORIES = ['MEN', 'WOMEN'];

    // Загрузка чемпионата
    useEffect(() => {
        const fetchChampionship = async () => {
            try {
                const res = await cachedGet(`${config.API_URL}/api/championships?populate=*`);
                if (res.data.data.length > 0) setChampionship(res.data.data[0]);
            } catch (e) { console.error(e); }
        };
        fetchChampionship();
    }, []);

    // Загрузка блока ESC PLATFORM
    useEffect(() => {
        const fetchPlatform = async () => {
            try {
                const res = await cachedGet(`${config.API_URL}/api/esc-platforms?populate=*`);
                if (res.data.data.length > 0) setPlatform(res.data.data[0]);
            } catch (e) { console.error('Ошибка загрузки ESC PLATFORM:', e); }
        };
        fetchPlatform();
    }, []);

    // Тикер «сейчас» — раз в секунду, для таймера и статуса главного события
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    // Загрузка ближайших событий: только те, что ещё не прошли, по возрастанию даты
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const today = new Date().toISOString().slice(0, 10);
                const response = await cachedGet(
                    `${config.API_URL}/api/events?filters[date][$gte]=${today}&sort=date:asc&pagination[limit]=3`
                );
                setEvents(response.data.data || []);
            } catch (error) {
                console.error('Ошибка загрузки событий:', error);
            } finally {
                setEventsLoaded(true);
            }
        };
        fetchEvents();
    }, []);

    // Загрузка рейтинга
    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const response = await cachedGet(
                    `${config.API_URL}/api/ranking-details?filters[discipline][$eq]=10m Air Rifle&sort=position:asc&pagination[pageSize]=50`
                );
                setRankings(response.data.data || []);
            } catch (error) { console.error('Ошибка загрузки рейтинга:', error); }
        };
        fetchRankings();
    }, []);

    // Ротация категорий рейтинга каждые 5 секунд (муж ↔ жен по кругу)
    useEffect(() => {
        const present = RANKING_CATEGORIES.filter((cat) => rankings.some((r) => r.category === cat));
        if (present.length < 2) {
            if (present.length === 1) setActiveCategory(present[0]);
            return;
        }
        setActiveCategory((prev) => (present.includes(prev) ? prev : present[0]));
        const interval = setInterval(() => {
            setActiveCategory((prev) => {
                const idx = present.indexOf(prev);
                return present[(idx + 1) % present.length];
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [rankings]);

    const handleEventInfo = () => { if (championship?.slug) router.push(`/events/${championship.slug}`); };
    const handleEntrySystem = () => {
        const link = platform?.buttonLink || 'https://esc-entry.eu';
        if (/^https?:\/\//.test(link)) window.open(link, '_blank', 'noopener,noreferrer');
        else router.push(link);
    };
    const handleAllEvents = () => router.push('/events');
    const handleFull = () => router.push('/results');
    const handleEventClick = (eventSlug) => { if (eventSlug) router.push(`/events/${eventSlug}`); };

    // Состояние главного события: countdown / ongoing / finished / postponed / cancelled
    const champState = (() => {
        if (!championship) return { kind: 'loading' };
        const status = (championship.status || 'SCHEDULED').toUpperCase();
        if (status === 'CANCELLED') return { kind: 'cancelled' };
        if (status === 'POSTPONED') return { kind: 'postponed' };
        const start = championship.startDate ? new Date(championship.startDate).getTime() : null;
        const end = championship.endDate ? new Date(championship.endDate).getTime() : null;
        if (start && now < start) {
            const d = start - now;
            return {
                kind: 'countdown',
                days: Math.floor(d / 86400000),
                hours: Math.floor(d / 3600000) % 24,
                minutes: Math.floor(d / 60000) % 60,
            };
        }
        if (end && now > end) return { kind: 'finished' };
        if (start && now >= start) return { kind: 'ongoing' };
        return { kind: 'countdown', days: 0, hours: 0, minutes: 0 };
    })();
    const STATUS_TEXT = {
        ongoing: 'EVENT IN PROGRESS',
        finished: 'EVENT FINISHED',
        postponed: 'EVENT POSTPONED',
        cancelled: 'EVENT CANCELLED',
    };

    const visibleRankings = rankings
        .filter((item) => item.discipline === '10m Air Rifle' && item.category === activeCategory)
        .sort((a, b) => a.position - b.position)
        .slice(0, 5);

    return (
        <section className="full-info">
            <div className="full-info-content">
                <div className="wrapper">
                    {/* PART 1 - WHAT'S ON — клик по всей карточке открывает событие */}
                    <div className="part1" onClick={handleEventInfo} role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEventInfo(); } }}>
                        <div className="part-top">
                            <p className="theme1">{championship?.theme}</p>
                            <p className="title1">
                                {championship?.title?.split('\n').slice(0, 2).map((line, i) => (
                                    <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
                                ))}
                            </p>
                            <div>
                                <span className="card-text1">{championship?.subtitle}</span>
                                <span className="point">•</span>
                                <span className="card-text1">{championship?.city}</span>
                            </div>
                        </div>
                        <div className="part-bottom">
                            {champState.kind === 'countdown' ? (
                                <>
                                    <p className="theme1">{championship?.countdownLabel}</p>
                                    <div className="countdown-timer">
                                        <div className="time-block">
                                            <span className="time-number">{String(champState.days).padStart(3, '0')}</span>
                                            <span className="time-label">DAYS</span>
                                        </div>
                                        <div className="time-block">
                                            <span className="time-number">{String(champState.hours).padStart(2, '0')}</span>
                                            <span className="time-label">HRS</span>
                                        </div>
                                        <div className="time-block">
                                            <span className="time-number">{String(champState.minutes).padStart(2, '0')}</span>
                                            <span className="time-label">MIN</span>
                                        </div>
                                    </div>
                                </>
                            ) : champState.kind !== 'loading' ? (
                                <div className={`champ-status champ-status--${champState.kind}`}>
                                    <span className="champ-status-dot"></span>
                                    <span className="champ-status-text">{STATUS_TEXT[champState.kind]}</span>
                                    {champState.kind === 'postponed' && (
                                        <span className="champ-status-sub">New date to be announced</span>
                                    )}
                                </div>
                            ) : null}
                            <button className="event-info-btn" onClick={handleEventInfo}>
                                EVENT INFO &gt;
                            </button>
                        </div>
                    </div>

                    {/* PART 2 - ESC PLATFORM */}
                    <div className="part2">
                        <div className="part-top">
                            <p className="theme2">{platform?.theme}</p>
                            <p className="title2">
                                {platform?.title?.split('\n').map((line, i, arr) => (
                                    <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                                ))}
                            </p>
                            <p className="card-text2">{platform?.text}</p>
                        </div>
                        <div className="part-bottom">
                            <button className="entry-system-btn" onClick={handleEntrySystem}>
                                {platform?.buttonLabel || 'ENTRY SYSTEM'} &gt;
                            </button>
                        </div>
                    </div>

                    {/* PART 3 - UPCOMING EVENTS */}
                    <div className="part3">
                        <div className="all-event-item">
                            <h4>UPCOMING EVENTS</h4>
                            {events.length > 0 ? (
                                events.map((event) => {
                                    const { name, date, location, statusEvent, slug } = event;
                                    const d = new Date(date);
                                    return (
                                        <div className="event-item" key={event.id} onClick={() => handleEventClick(slug)} style={{ cursor: 'pointer' }}>
                                            <div className="event-left">
                                                <div className="event-date-block">
                                                    <span className="event-date">{d.getDate()}</span>
                                                    <span className="event-month">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="event-year">{d.getFullYear()}</span>
                                                </div>
                                                <div className="event-details">
                                                    <span className="event-name">{name}</span>
                                                    <div className="geolocation">
                                                        <i className="fa-solid fa-location-dot"></i>
                                                        <p>{location}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="status">{statusEvent}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="fi-empty">{eventsLoaded ? 'No upcoming events at the moment' : 'Loading…'}</div>
                            )}
                        </div>
                        <button className="all-events-btn" onClick={handleAllEvents}>
                            ALL EVENTS &gt;
                        </button>
                    </div>

                    {/* PART 4 - ESC RANKING */}
                    <div className="part4">
                        <div className="ranking-header">
                            <h4>ESC RANKING</h4>
                            <button className="go-to-full" onClick={handleFull}>FULL &gt;</button>
                        </div>
                        <p className="description">
                            10M AIR RIFLE {activeCategory === 'WOMEN' ? 'W' : activeCategory === 'MEN' ? 'M' : ''}
                        </p>
                        <div className="ranking-list" key={activeCategory}>
                            {visibleRankings.length > 0 ? (
                                visibleRankings.map((item, idx) => {
                                    const { athleteName, country, points } = item;
                                    return (
                                        <div className={`ranking-item ${idx === 0 ? 'first-place' : ''}`} key={item.id}>
                                            <div className="rank-info">
                                                <span className="rank">{idx + 1}</span>
                                                <div className="athlete-info">
                                                    <span className="name">{athleteName}</span>
                                                    <span className="country">{country}</span>
                                                </div>
                                            </div>
                                            <span className="points">{points}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="fi-empty">No ranking data yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FullInfo;
