'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cachedGet } from '@/lib/apiCache';
import config from '@/lib/config';
import './ErrorPage.css';

// Одна база под все состояния ошибок: 404 / 500 / техработы / офлайн
const VARIANTS = {
    '404': {
        title: 'TARGET NOT FOUND',
        text: ["The page you're looking for has missed the mark.", 'It may have been moved, removed, or never existed.'],
        search: true,
    },
    '500': {
        title: 'SHOT WENT WIDE',
        text: ['Something went wrong on our end.', "Give it another shot — we're resetting the range."],
        retry: true,
    },
    maintenance: {
        title: 'RANGE UNDER MAINTENANCE',
        text: ["We're tuning things up and will be back shortly.", 'Thanks for your patience.'],
    },
    offline: {
        title: "YOU'RE OFFLINE",
        text: ['No connection detected.', 'Check your network and try again.'],
        retry: true,
    },
};

const typeIcon = (type) => ({
    News: 'fa-newspaper', Event: 'fa-calendar-day', Document: 'fa-file-lines',
    Federation: 'fa-flag', Video: 'fa-play',
}[type] || 'fa-magnifying-glass');

const ErrorPage = ({ variant = '404', reset }) => {
    const v = VARIANTS[variant] || VARIANTS['404'];
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const boxRef = useRef(null);
    const router = useRouter();

    // Названия — как в главном меню (Header), чтобы не расходились с навигацией/футером
    const popularLinks = [
        { label: 'Calendar', href: '/events' },
        { label: 'Results & Rankings', href: '/results' },
        { label: 'Documents', href: '/documents' },
        { label: 'Member Federations', href: '/members' },
        { label: 'Media', href: '/media' },
    ];

    // Живой поиск по контенту (как в шапке) — первое, что нужно попавшему на 404
    useEffect(() => {
        if (!v.search) return;
        const q = query.trim();
        if (!q) { setSuggestions([]); setSearching(false); return; }
        const controller = new AbortController();
        const enc = encodeURIComponent(q);
        const ql = q.toLowerCase();
        const match = (s) => (s || '').toLowerCase().includes(ql);
        const run = async () => {
            setSearching(true);
            const get = (url) => cachedGet(`${config.API_URL}${url}`, { signal: controller.signal }).then((r) => r.data).catch(() => null);
            const arr = (d) => (d?.data ? d.data : (Array.isArray(d) ? d : []));
            try {
                const [news, events, docs, feds] = await Promise.all([
                    get(`/api/news-items?filters[title][$containsi]=${enc}&pagination[pageSize]=5`),
                    get(`/api/events?filters[name][$containsi]=${enc}&sort=date:desc&pagination[pageSize]=5`),
                    get(`/api/docs?filters[title][$containsi]=${enc}&pagination[pageSize]=5`),
                    get(`/api/federations?filters[name][$containsi]=${enc}&pagination[pageSize]=5`),
                ]);
                const out = [];
                arr(news).forEach((n) => n.slug && match(n.title) && out.push({ type: 'News', label: n.title, path: `/media/${n.slug}` }));
                arr(events).forEach((e) => e.slug && match(e.name) && out.push({ type: 'Event', label: e.name, path: `/events/${e.slug}` }));
                arr(docs).forEach((d) => match(d.title) && out.push({ type: 'Document', label: d.title, path: `/documents` }));
                arr(feds).forEach((f) => match(f.name || f.country) && out.push({ type: 'Federation', label: f.name || f.country, path: `/members` }));
                setSuggestions(out.slice(0, 5));
            } catch (_) { /* игнор */ }
            finally { setSearching(false); }
        };
        const t = setTimeout(run, 250);
        return () => { clearTimeout(t); controller.abort(); };
    }, [query, v.search]);

    const go = (s) => { setQuery(''); setSuggestions([]); router.push(s.path); };

    return (
        <section className="error-page">
            <div className="target-icon">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
                <div className="circle circle-4"></div>
                <div className="circle circle-5"></div>
                <div className="circle circle-6"></div>
                <span className="line line-top"></span>
                <span className="line line-right"></span>
                <span className="line line-bottom"></span>
                <span className="line line-left"></span>
            </div>
            <div className="center-dot"></div>
            <div className="error-content">
                <div className="glow-line"></div>
                <h1 className="error-title">{v.title}</h1>
                <p className="error-text">
                    {v.text.map((line, i) => (
                        <span key={i}>{line}{i < v.text.length - 1 && <br />}</span>
                    ))}
                </p>

                {v.search && (
                    <div className="error-search" ref={boxRef}>
                        <i className="fa-solid fa-magnifying-glass error-search-icon"></i>
                        <input
                            type="text"
                            className="error-search-input"
                            placeholder="Search the site…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && suggestions[0]) go(suggestions[0]); }}
                            autoFocus
                        />
                        {query.trim() && (
                            <div className="error-search-results">
                                {suggestions.length > 0 ? suggestions.map((s, i) => (
                                    <div key={i} className="error-search-item" onClick={() => go(s)}>
                                        <i className={`fa-solid ${typeIcon(s.type)}`}></i>
                                        <span className="error-search-label">{s.label}</span>
                                        <span className="error-search-type">{s.type}</span>
                                    </div>
                                )) : (
                                    <div className="error-search-empty">{searching ? 'Searching…' : 'No results found'}</div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="error-buttons">
                    {v.retry ? (
                        <button className="back-home-btn" onClick={() => (reset ? reset() : window.location.reload())}>
                            <i className="fa-solid fa-rotate-right"></i> Try again
                        </button>
                    ) : (
                        <Link href="/" className="back-home-btn">
                            <i className="fa-solid fa-arrow-left"></i> Back to Home
                        </Link>
                    )}
                    <Link href="/events" className="view-events-btn">
                        View Events <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                </div>
            </div>
            <div className="popular-divider"></div>
            <div className="popular-pages">
                <p className="popular-title">Popular Pages</p>
                <div className="popular-links">
                    {popularLinks.map((link) => (
                        <Link key={link.href} href={link.href} className="popular-link">
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ErrorPage;
