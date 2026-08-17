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
    // Дисциплина блока ESC RANKING настраивается в Strapi (ESC Platform → rankingDiscipline).
    // Enum в Strapi не может начинаться с цифры, поэтому значения маппим на реальные строки дисциплин.
    const RANKING_DISCIPLINE_MAP = {
        'Air Rifle 10m': '10m Air Rifle',
        'Air Pistol 10m': '10m Air Pistol',
        'Pistol 25m': '25m Pistol',
        'Rapid Fire Pistol 25m': '25m Rapid Fire Pistol',
        'Rifle 3 Position 50m': '50m Rifle 3 Position',
        'Skeet': 'Skeet',
        'Trap': 'Trap',
    };
    const rankingDiscipline = RANKING_DISCIPLINE_MAP[platform?.rankingDiscipline] || '10m Air Rifle';

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

    // Загрузка событий вокруг «сейчас»: недавно начавшиеся/завершившиеся + ближайшие, по дате.
    // Окно от (сегодня − 14 дней), чтобы показать и идущие (ONGOING), и недавно завершённые (FINISHED).
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const windowStart = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
                const response = await cachedGet(
                    `${config.API_URL}/api/events?filters[date][$gte]=${windowStart}&sort=date:asc&pagination[limit]=3`
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
                    `${config.API_URL}/api/ranking-details?filters[discipline][$eq]=${encodeURIComponent(rankingDiscipline)}&sort=position:asc&pagination[pageSize]=50`
                );
                setRankings(response.data.data || []);
            } catch (error) { console.error('Ошибка загрузки рейтинга:', error); }
        };
        fetchRankings();
    }, [rankingDiscipline]);

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

    // Состояние главного события по датам: countdown / ongoing / finished
    const champState = (() => {
        if (!championship) return { kind: 'loading' };
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
    };

    // Статус события в списке UPCOMING — считаем по датам (enum statusEvent не содержит ONGOING).
    const evStatus = (ev) => {
        const s = ev.date ? new Date(`${ev.date}T00:00:00`).getTime() : null;
        const e = ev.endDate ? new Date(`${ev.endDate}T23:59:59`).getTime() : s;
        if (e != null && now > e) return 'FINISHED';
        if (s != null && now >= s) return 'ONGOING';
        return 'UPCOMING';
    };

    const visibleRankings = rankings
        .filter((item) => item.discipline === rankingDiscipline && item.category === activeCategory)
        .sort((a, b) => a.position - b.position)
        .slice(0, 5);

    return (
        <section className="full-info">
            <div className="full-info-content">
                <div className="wrapper">
                    {/* PART 1 - WHAT'S ON — клик по всей карточке открывает событие */}
                    <div className="part1" onClick={handleEventInfo} role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEventInfo(); } }}>
                        {championship ? (<>
                        <div className="part-top">
                            <p className="theme1">{championship?.theme}</p>
                            <p className="title1">
                                {(championship?.headline
                                    ? championship.headline.split('\n')
                                    : (championship?.title || '').split('\n').slice(0, 2)
                                ).map((line, i, arr) => (
                                    <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
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
                                </div>
                            ) : null}
                            <button className="event-info-btn" onClick={handleEventInfo}>
                                EVENT INFO &gt;
                            </button>
                        </div>
                        </>) : (
                            <div className="fi-block-empty">
                                <i className="fa-regular fa-calendar-xmark fi-block-empty-icon"></i>
                                <p className="fi-block-empty-title">No featured event</p>
                                <p className="fi-block-empty-text">The next championship will appear here.</p>
                            </div>
                        )}
                    </div>

                    {/* PART 2 - ESC PLATFORM */}
                    <div className="part2">
                        {platform ? (<>
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
                        </>) : (
                            <div className="fi-block-empty">
                                <i className="fa-solid fa-display fi-block-empty-icon"></i>
                                <p className="fi-block-empty-title">ESC Platform</p>
                                <p className="fi-block-empty-text">Entry system details coming soon.</p>
                            </div>
                        )}
                    </div>

                    {/* PART 3 - UPCOMING EVENTS */}
                    <div className="part3">
                        <div className="all-event-item">
                            <h4>UPCOMING EVENTS</h4>
                            {events.length > 0 ? (
                                events.map((event) => {
                                    const { name, date, location, slug } = event;
                                    const d = new Date(date);
                                    const st = evStatus(event);
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
                                            <span className={`status status--${st.toLowerCase()}`}>{st === 'ONGOING' ? 'IN PROGRESS' : st}</span>
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
                            {rankingDiscipline.toUpperCase()} {activeCategory === 'WOMEN' ? 'W' : activeCategory === 'MEN' ? 'M' : ''}
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
