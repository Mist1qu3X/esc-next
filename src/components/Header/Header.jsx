'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import config from '@/lib/config';

const Header = () => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);
    const touchStart = useRef(null);
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { label: 'Home', href: '/' },
        { label: 'About Us', href: '/discover' },
        { label: 'Calendar', href: '/events' },
        { label: 'Results & Ranking', href: '/results' },
        { label: 'Documents', href: '/documents' },
        { label: 'Media', href: '/media' },
        { label: 'Member Federations', href: '/members' },
        { label: 'Contacts', href: '/contacts' },
    ];

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // Реальный поиск по контенту Strapi (новости/события/документы/федерации/видео)
    useEffect(() => {
        const q = searchQuery.trim();
        if (!q) { setSuggestions([]); setIsSearching(false); return; }
        const controller = new AbortController();
        const enc = encodeURIComponent(q);
        const ql = q.toLowerCase();
        const match = (s) => (s || '').toLowerCase().includes(ql);
        const run = async () => {
            setIsSearching(true);
            const get = (url) =>
                axios.get(`${config.API_URL}${url}`, { signal: controller.signal }).then((r) => r.data).catch(() => null);
            const arr = (d) => (d?.data ? d.data : (Array.isArray(d) ? d : []));
            try {
                const [news, events, docs, feds, videos] = await Promise.all([
                    get(`/api/news-items?filters[title][$containsi]=${enc}&pagination[pageSize]=5`),
                    get(`/api/events?filters[name][$containsi]=${enc}&sort=date:desc&pagination[pageSize]=5`),
                    get(`/api/docs?filters[title][$containsi]=${enc}&pagination[pageSize]=5`),
                    get(`/api/federations?filters[name][$containsi]=${enc}&pagination[pageSize]=5`),
                    get(`/api/videos?filters[title][$containsi]=${enc}&pagination[pageSize]=4`),
                ]);
                const out = [];
                arr(news).forEach((n) => n.slug && match(n.title) && out.push({ type: 'News', label: n.title, path: `/media/${n.slug}` }));
                arr(events).forEach((e) => e.slug && match(e.name) && out.push({ type: 'Event', label: e.name, path: `/events/${e.slug}` }));
                arr(docs).forEach((d) => match(d.title) && out.push({ type: 'Document', label: d.title, path: `/documents` }));
                arr(feds).forEach((f) => match(f.name || f.country) && out.push({ type: 'Federation', label: f.name || f.country, path: `/members` }));
                arr(videos).forEach((v) => v.documentId && match(v.title) && out.push({ type: 'Video', label: v.title, path: `/media/video/${v.documentId}` }));
                setSuggestions(out.slice(0, 3));
            } catch (_) { /* отменённый/сетевой — игнор */ }
            finally { setIsSearching(false); }
        };
        const debounce = setTimeout(run, 250);
        return () => { clearTimeout(debounce); controller.abort(); };
    }, [searchQuery]);

    const typeIcon = (type) => ({
        News: 'fa-newspaper', Event: 'fa-calendar-day', Document: 'fa-file-lines',
        Federation: 'fa-flag', Video: 'fa-play',
    }[type] || 'fa-magnifying-glass');

    // Закрытие подсказок при клике вне
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setIsSearchActive(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Мобильное меню: Escape закрывает, фон не скроллится пока меню открыто
    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
    }, [isMobileMenuOpen]);

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        setIsSearchActive(false);
        setIsMobileMenuOpen(false);
        router.push(suggestion.path);
    };

    const handleEntrySystem = () => {
        window.open('https://esc-entry.eu', '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            <header className="header">
                <Link href="/" className="logospace">
                    <img src="/img/Frame%20175.svg" alt="European Shooting Confederation" className="logo-full" />
                </Link>

                <nav className="navigation">
                    <ul>
                        {navItems.map((item, i) => (
                            <li key={i} className={pathname === item.href ? 'active' : ''}>
                                <Link href={item.href}>{item.label}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="search-bar-container" ref={searchRef}>
                    <div className={`search-wrapper ${isSearchActive ? 'active' : ''}`}>
                        <i 
                            className="fa-solid fa-magnifying-glass search-icon"
                            onClick={() => setIsSearchActive(!isSearchActive)}
                        ></i>
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                                setIsSearchActive(true);
                            }}
                            onFocus={() => {
                                setShowSuggestions(true);
                                setIsSearchActive(true);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') { setIsSearchActive(false); setShowSuggestions(false); }
                                if (e.key === 'Enter' && suggestions.length > 0) handleSuggestionClick(suggestions[0]);
                            }}
                        />
                        
                        {/* Выпадающий список результатов поиска */}
                        {showSuggestions && searchQuery.trim() && (
                            <div className="search-suggestions">
                                {suggestions.length > 0 ? (
                                    suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="search-suggestion-item"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            <div className="suggestion-icon">
                                                <i className={`fa-solid ${typeIcon(suggestion.type)}`}></i>
                                            </div>
                                            <div className="suggestion-content">
                                                <span className="suggestion-label">{suggestion.label}</span>
                                                <span className="suggestion-type">{suggestion.type}</span>
                                            </div>
                                            <i className="fa-solid fa-arrow-right suggestion-arrow"></i>
                                        </div>
                                    ))
                                ) : (
                                    <div className="search-suggestion-empty">
                                        {isSearching ? 'Searching…' : 'No results found'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button className="search-input-button" onClick={handleEntrySystem}>
                        ENTRY SYSTEM<img src="/img/ArrowUpRight.png" alt="" className="arrow" />
                    </button>
                    <button className="burger-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <i className="fa-solid fa-bars"></i>
                    </button>
                </div>
            </header>

            <div
                className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={(e) => { if (e.target === e.currentTarget) setIsMobileMenuOpen(false); }}
                onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                onTouchEnd={(e) => {
                    if (!touchStart.current) return;
                    const dx = e.changedTouches[0].clientX - touchStart.current.x;
                    const dy = e.changedTouches[0].clientY - touchStart.current.y;
                    if (dx > 70 && Math.abs(dx) > Math.abs(dy)) setIsMobileMenuOpen(false); // свайп вправо — закрыть
                    touchStart.current = null;
                }}
            >
                <div className="mobile-nav-top">
                    <Link href="/" className="mobile-nav-logo" onClick={closeMobileMenu}>
                        <img src="/img/Frame%20175.svg" alt="European Shooting Confederation" />
                    </Link>
                    <button className="mobile-nav-close" onClick={closeMobileMenu} aria-label="Close menu">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Поиск в мобильном меню (на десктопе лупа в шапке — на мобильном она пропадала) */}
                <div className="mobile-nav-search">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                        type="text"
                        placeholder="Search…"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && suggestions.length > 0) handleSuggestionClick(suggestions[0]); }}
                    />
                    {searchQuery.trim() && (
                        <div className="mobile-nav-suggestions">
                            {suggestions.length > 0 ? suggestions.map((s, i) => (
                                <div key={i} className="mobile-nav-suggestion" onClick={() => handleSuggestionClick(s)}>
                                    <i className={`fa-solid ${typeIcon(s.type)}`}></i>
                                    <span className="mobile-nav-suggestion-label">{s.label}</span>
                                    <span className="mobile-nav-suggestion-type">{s.type}</span>
                                </div>
                            )) : (
                                <div className="mobile-nav-suggestion-empty">{isSearching ? 'Searching…' : 'No results found'}</div>
                            )}
                        </div>
                    )}
                </div>

                <ul className="mobile-nav-list">
                    {navItems.map((item, i) => (
                        <li key={i} className={pathname === item.href ? 'active' : ''}>
                            <Link href={item.href} onClick={closeMobileMenu}>{item.label}</Link>
                            {pathname === item.href && <span className="mobile-nav-dot"></span>}
                        </li>
                    ))}
                </ul>

                <div className="mobile-nav-footer">
                    <button className="mobile-nav-entry" onClick={() => { setIsMobileMenuOpen(false); handleEntrySystem(); }}>
                        ENTRY SYSTEM<img src="/img/ArrowUpRight.png" alt="" className="arrow" />
                    </button>
                </div>
            </div>
        </>
    );
};

export default Header;