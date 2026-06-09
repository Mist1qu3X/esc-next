'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import './FullInfo.css';
import config from '@/lib/config';

const FullInfo = () => {
    const [events, setEvents] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [championship, setChampionship] = useState(null);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
    const router = useRouter();

    // Загрузка чемпионата
    useEffect(() => {
        const fetchChampionship = async () => {
            try {
                const res = await axios.get(`${config.API_URL}/api/championships?populate=*`);
                if (res.data.data.length > 0) {
                    setChampionship(res.data.data[0]);
                }
            } catch (e) { console.error(e); }
        };
        fetchChampionship();
    }, []);

    // Таймер
    useEffect(() => {
        if (!championship?.startDate) return;
        const targetDate = new Date(championship.startDate);
        const timer = setInterval(() => {
            const now = new Date();
            const difference = targetDate - now;
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60)
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [championship]);

    // Загрузка событий
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get(
                    `${config.API_URL}/api/events?sort=date:asc&pagination[limit]=3`
                );
                setEvents(response.data.data);
            } catch (error) { console.error('Ошибка загрузки событий:', error); }
        };
        fetchEvents();
    }, []);

    // Загрузка рейтинга
    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const response = await axios.get(
                    `${config.API_URL}/api/ranking-details?sort=position:asc`
                );
                setRankings(response.data.data);
            } catch (error) { console.error('Ошибка загрузки рейтинга:', error); }
        };
        fetchRankings();
    }, []);

    const handleEventInfo = () => {
        if (championship?.slug) {
            router.push(`/events/${championship.slug}`);
        }
    };

    const handleEntrySystem = () => {
        router.push('/documents');
    };

    const handleAllEvents = () => {
        router.push('/events');  // Просто переход на страницу событий, без hash
    };

    const handleFull = () => {
        router.push('/results');
    };

    const handleEventClick = (eventSlug) => {
        if (eventSlug) {
            router.push(`/events/${eventSlug}`);
        }
    };

    return (
        <section className="full-info">
            <div className="full-info-content">
                <div className="wrapper">
                    {/* PART 1 - WHAT'S ON */}
                    <div className="part1">
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
                            <p className="theme1">{championship?.countdownLabel}</p>
                            <div className="countdown-timer">
                                <div className="time-block">
                                    <span className="time-number">{String(timeLeft.days).padStart(3, '0')}</span>
                                    <span className="time-label">DAYS</span>
                                </div>
                                <div className="time-block">
                                    <span className="time-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                                    <span className="time-label">HRS</span>
                                </div>
                                <div className="time-block">
                                    <span className="time-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                    <span className="time-label">MIN</span>
                                </div>
                            </div>
                            <button className="event-info-btn" onClick={handleEventInfo}>
                                EVENT INFO &gt;
                            </button>
                        </div>
                    </div>

                    {/* PART 2 - ESC PLATFORM */}
                    <div className="part2">
                        <div className="part-top">
                            <p className="theme2">ESC PLATFORM</p>
                            <p className="title2">GET CLOSER<br /> TO THE ACTION</p>
                            <p className="card-text2">Access live results, rankings, and event documents all in one place.</p>
                        </div>
                        <div className="part-bottom">
                            <button className="entry-system-btn" onClick={handleEntrySystem}>
                                ENTRY SYSTEM &gt;
                            </button>
                        </div>
                    </div>

                    {/* PART 3 - UPCOMING EVENTS */}
                    <div className="part3">
                        <div className="all-event-item">
                            <h4>UPCOMING EVENTS</h4>
                            {events.map((event) => {
                                const { name, date, month, location, statusEvent, slug } = event;
                                return (
                                    <div 
                                        className="event-item" 
                                        key={event.id}
                                        onClick={() => handleEventClick(slug)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="event-left">
                                            <div className="event-date-block">
                                                <span className="event-date">{new Date(date).getDate()}</span>
                                                <span className="event-month">{month}</span>
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
                            })}
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
                        <p className="description">10M AIR RIFLE W</p>
                        <div className="ranking-list">
                            {rankings.map((item) => {
                                const { position, athleteName, country, points } = item;
                                return (
                                    <div 
                                        className={`ranking-item ${position === 1 ? 'first-place' : ''}`} 
                                        key={item.id}
                                    >
                                        <div className="rank-info">
                                            <span className="rank">{position}</span>
                                            <div className="athlete-info">
                                                <span className="name">{athleteName}</span>
                                                <span className="country">{country}</span>
                                            </div>
                                        </div>
                                        <span className="points">{points}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FullInfo;