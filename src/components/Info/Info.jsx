'use client';
import React, { useState, useEffect, useRef } from 'react';
import { cachedGet } from '@/lib/apiCache';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import { imageUrl } from '@/lib/media';
import './Info.css';

// Главный баннер = слайдер (коллекция Hero Slide в админке: событие / новость / видео).
// Если слайдов нет — фолбэк на текущий Championship-баннер (поведение как раньше).
const Info = () => {
    const [slides, setSlides] = useState(null); // null = ещё грузим
    const [champ, setChamp] = useState(null);
    const [idx, setIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchX = useRef(null);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            let s = [];
            try {
                const r = await cachedGet(`${config.API_URL}/api/hero-slides?populate[image]=true&sort=order:asc&pagination[pageSize]=12`);
                s = (r.data?.data || []);
            } catch (e) { /* коллекции ещё нет / сеть — уходим в фолбэк */ }
            setSlides(s);
            if (!s.length) {
                try {
                    const c = await cachedGet(`${config.API_URL}/api/championships?populate=*`);
                    setChamp(c.data?.data?.[0] || null);
                } catch (e) { /* нет чемпионата — покажем пустое состояние */ }
            }
        })();
    }, []);

    // Championship → приводим к виду слайда, чтобы рендерить единым шаблоном.
    const champSlide = champ ? {
        type: 'event',
        kicker: 'FEATURED EVENT',
        title: champ.title,
        subtitle: champ.location,
        dateText: champ.dateRange,
        image: champ.image,
        buttonLabel: 'VIEW EVENT',
        link: champ.slug ? `/events/${champ.slug}` : null,
    } : null;

    const list = (slides && slides.length) ? slides : (champSlide ? [champSlide] : []);
    const many = list.length > 1;
    const cur = list.length ? list[Math.min(idx, list.length - 1)] : null;

    // Автопрокрутка (пауза при наведении/касании)
    useEffect(() => {
        if (!many || paused) return;
        const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 6000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [many, paused, list.length]);

    const go = (i) => setIdx((i + list.length) % list.length);
    const goLink = (link) => {
        if (!link) return;
        if (/^https?:\/\//i.test(link)) window.open(link, '_blank', 'noopener');
        else router.push(link);
    };
    const heroImg = cur ? imageUrl(cur.image, 'full') : null;

    const subIcon = (t) => (t === 'event' ? 'fa-location-dot' : t === 'video' ? 'fa-film' : 'fa-newspaper');

    if (slides === null) return <section className="info-section"></section>; // загрузка

    // Пустое состояние (нет ни слайдов, ни чемпионата)
    if (!cur) {
        return (
            <section className="info-section">
                <div className="info-section-content">
                    <span className="info-section-empty-kicker">EUROPEAN SHOOTING CONFEDERATION</span>
                    <p className="info-section-nameing" style={{ fontSize: 'clamp(28px, 6vw, 72px)' }}>No featured content right now</p>
                    <p className="info-section-empty-sub">New events, news and videos will appear here. Meanwhile, explore the full calendar.</p>
                </div>
                <div className="info-section-bottom">
                    <div className="info-section-buttons-wrapper">
                        <button className="info-section-btn-view-event" onClick={() => router.push('/events')}>VIEW CALENDAR &gt;</button>
                    </div>
                </div>
            </section>
        );
    }

    const kicker = cur.kicker || '';
    const rawTitle = (cur.title || '').trim();
    const titleLines = Math.max(rawTitle.split('\n').length, Math.ceil(rawTitle.replace(/\s+/g, ' ').length / 22));
    const titleMaxPx = Math.max(32, 90 - titleLines * 5);
    // Есть ли поверх кадра текст. Если нет — не затемняем (кадр остаётся ярким целиком).
    const hasText = !!(kicker || rawTitle || cur.subtitle || cur.dateText);
    // Две кнопки по типу слайда: VIEW X (конкретный элемент, поле link) + ALL X (список).
    const T = {
        event: { view: 'VIEW EVENT', all: 'ALL EVENTS', allLink: '/events' },
        news: { view: 'VIEW NEWS', all: 'ALL NEWS', allLink: '/media?filter=NEWS' },
        video: { view: 'VIEW VIDEO', all: 'ALL VIDEOS', allLink: '/media?filter=VIDEOS' },
    };
    const tt = T[cur.type] || T.event;

    return (
        <section
            className={`info-section ${many ? 'has-slider' : ''} ${hasText ? '' : 'no-dim'}`}
            style={heroImg ? { '--hero-img': `url(${heroImg})` } : undefined}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
            onTouchEnd={(e) => {
                if (touchX.current == null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                if (many && Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1));
                touchX.current = null; setPaused(false);
            }}
        >
            {(kicker || rawTitle) && (
                <div className="info-section-content" key={idx}>
                    {kicker && <span className={`hero-kicker hero-kicker-${cur.type}`}>{kicker}</span>}
                    {rawTitle && (
                        <p className="info-section-nameing" style={{ fontSize: `clamp(28px, 6vw, ${titleMaxPx}px)` }}>
                            {rawTitle.split('\n').map((line, i, arr) => (
                                <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                            ))}
                        </p>
                    )}
                </div>
            )}

            <div className="info-section-bottom">
                {(cur.subtitle || cur.dateText) && (
                    <div className="info-section-event-details">
                        {cur.subtitle && (
                            <div className="info-section-location-wrapper">
                                <i className={`fa-solid ${subIcon(cur.type)}`}></i>
                                <p className="info-section-location">{cur.subtitle}</p>
                            </div>
                        )}
                        {cur.subtitle && cur.dateText && <span className="info-section-event-separator">•</span>}
                        {cur.dateText && (
                            <div className="info-section-date-wrapper">
                                <i className="fa-regular fa-calendar"></i>
                                <p className="info-section-date">{cur.dateText}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="info-section-buttons-wrapper">
                    {cur.link && (
                        <button className="info-section-btn-view-event" onClick={() => goLink(cur.link)}>{tt.view}</button>
                    )}
                    <button className={cur.link ? 'info-section-btn-all-events' : 'info-section-btn-view-event'} onClick={() => goLink(tt.allLink)}>{tt.all}</button>
                </div>

                {/* точки + стрелки — только если слайдов несколько */}
                {many && (
                    <div className="hero-nav">
                        <button className="hero-arrow" onClick={() => go(idx - 1)} aria-label="Previous"><i className="fa-solid fa-chevron-left"></i></button>
                        <div className="hero-dots">
                            {list.map((_, i) => (
                                <button key={i} className={`hero-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`}></button>
                            ))}
                        </div>
                        <button className="hero-arrow" onClick={() => go(idx + 1)} aria-label="Next"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Info;
