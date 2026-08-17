'use client';
import React, { useState, useEffect } from 'react';
import { cachedGet } from '@/lib/apiCache';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import './Info.css';

const Info = () => {
    const [championship, setChampionship] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const champResponse = await cachedGet(
                    `${config.API_URL}/api/championships?populate=*`
                );
                if (champResponse.data.data.length > 0) {
                    setChampionship(champResponse.data.data[0]);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleViewEvent = () => {
        if (championship?.slug) {
            router.push(`/events/${championship.slug}`);
        }
    };

    const handleAllEvents = () => {
        router.push('/events');  // Просто переход на страницу событий, без hash
    };

    if (loading) return <section className="info-section"></section>;

    const hasChamp = !!championship;

    const heroImg = championship?.image?.url
        ? (championship.image.url.startsWith('http') ? championship.image.url : `${config.API_URL}${championship.image.url}`)
        : null;

    // Чем длиннее название, тем меньше макс. размер шрифта — чтобы многострочный тайтл не растягивал
    // блок. Учитываем и явные переносы (\n), и перенос длинных строк (~22 симв./строку). Пол — 32px.
    const rawTitle = (championship?.title || '').trim();
    const titleLines = Math.max(
        rawTitle.split('\n').length,
        Math.ceil(rawTitle.replace(/\s+/g, ' ').length / 22)
    );
    const titleMaxPx = Math.max(32, 90 - titleLines * 5);

    return (
        <section
            className="info-section"
            style={heroImg ? { '--hero-img': `url(${heroImg})` } : undefined}
        >
            <div className="info-section-content">
                {hasChamp ? (
                    <p className="info-section-nameing" style={{ fontSize: `clamp(28px, 6vw, ${titleMaxPx}px)` }}>
                        {championship?.title?.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                {i < (championship?.title?.split('\n').length || 0) - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </p>
                ) : (
                    <>
                        <span className="info-section-empty-kicker">EUROPEAN SHOOTING CONFEDERATION</span>
                        <p className="info-section-nameing" style={{ fontSize: 'clamp(28px, 6vw, 72px)' }}>
                            No featured event right now
                        </p>
                        <p className="info-section-empty-sub">
                            New championships and cups will appear here. Meanwhile, explore the full calendar.
                        </p>
                    </>
                )}
            </div>

            {/* Нижний блок — location/date + кнопки ВМЕСТЕ, зафиксирован снизу-слева hero (32/65px) */}
            <div className="info-section-bottom">
                {hasChamp && (
                    <div className="info-section-event-details">
                        <div className="info-section-location-wrapper">
                            <i className="fa-solid fa-location-dot"></i>
                            <p className="info-section-location">{championship?.location}</p>
                        </div>
                        <span className="info-section-event-separator">•</span>
                        <div className="info-section-date-wrapper">
                            <i className="fa-regular fa-calendar"></i>
                            <p className="info-section-date">{championship?.dateRange}</p>
                        </div>
                    </div>
                )}

                <div className="info-section-buttons-wrapper">
                    {hasChamp && (
                        <button className="info-section-btn-view-event" onClick={handleViewEvent}>
                            VIEW EVENT &gt;
                        </button>
                    )}
                    <button className={hasChamp ? 'info-section-btn-all-events' : 'info-section-btn-view-event'} onClick={handleAllEvents}>
                        {hasChamp ? 'ALL EVENTS' : 'VIEW CALENDAR >'}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Info;