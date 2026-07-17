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
    const searchRef = useRef(null);
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { label: 'Home', href: '/' },
        { label: 'About Us', href: '/discover' },
        { label: 'Calendar', href: '/events' },
        { label: 'Results & Ranking', href: '/results' },
        { label: 'Documents', href: '/documents' },
        { label: 'Media', href: '/media' },
        { label: 'Contacts', href: '/members' },
    ];

    // Поиск подсказок при вводе текста
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!searchQuery.trim()) {
                setSuggestions([]);
                return;
            }

            const query = searchQuery.toLowerCase();
            const suggestionsList = [];

            // Проверяем категории
            const categories = [
                { name: 'News', keyword: 'news', path: '/media', filter: 'NEWS' },
                { name: 'Documents', keyword: 'documents', path: '/documents', filter: null },
                { name: 'Events', keyword: 'events', path: '/events', filter: null },
                { name: 'Results', keyword: 'results', path: '/results', filter: null },
                { name: 'Rankings', keyword: 'rankings', path: '/results', filter: null },
                { name: 'Media', keyword: 'media', path: '/media', filter: null },
                { name: 'Members', keyword: 'members', path: '/members', filter: null },
                { name: 'Federations', keyword: 'federations', path: '/members', filter: null },
                { name: 'Calendar', keyword: 'calendar', path: '/events', filter: null },
                { name: 'About', keyword: 'about', path: '/discover', filter: null },
                { name: 'Contact', keyword: 'contact', path: '/members', filter: null },
            ];

            // Проверяем соответствие категориям
            categories.forEach(cat => {
                if (cat.keyword.startsWith(query) || cat.name.toLowerCase().startsWith(query)) {
                    suggestionsList.push({
                        type: 'category',
                        label: cat.name,
                        path: cat.path,
                        filter: cat.filter
                    });
                }
            });

            // Добавляем быстрые ссылки
            const quickLinks = [
                { name: 'European Championship 2026', keyword: 'championship', path: '/events/european-championship-2026' },
                { name: 'Latest News', keyword: 'latest', path: '/media' },
                { name: 'Press Releases', keyword: 'press', path: '/media' },
                { name: 'Technical Rules', keyword: 'rules', path: '/documents' },
            ];

            quickLinks.forEach(link => {
                if (link.keyword.startsWith(query) || link.name.toLowerCase().startsWith(query)) {
                    suggestionsList.push({
                        type: 'link',
                        label: link.name,
                        path: link.path
                    });
                }
            });

            setSuggestions(suggestionsList.slice(0, 8));
        };

        const debounce = setTimeout(fetchSuggestions, 200);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

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

    const handleSuggestionClick = (suggestion) => {
        setSearchQuery('');
        setShowSuggestions(false);
        setIsSearchActive(false);
        
        if (suggestion.filter) {
            // Если есть фильтр, переходим на страницу с параметром
            router.push(`${suggestion.path}?filter=${suggestion.filter}`);
        } else {
            router.push(suggestion.path);
        }
    };

    const handleEntrySystem = () => {
        window.open('/entry-system', '_blank');
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
                            onKeyDown={(e) => e.key === 'Escape' && setIsSearchActive(false)}
                        />
                        
                        {/* Выпадающий список подсказок */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="search-suggestions">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="search-suggestion-item"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        <div className="suggestion-icon">
                                            {suggestion.type === 'category' ? (
                                                <i className="fa-solid fa-folder"></i>
                                            ) : (
                                                <i className="fa-solid fa-link"></i>
                                            )}
                                        </div>
                                        <div className="suggestion-content">
                                            <span className="suggestion-label">{suggestion.label}</span>
                                            <span className="suggestion-type">{suggestion.type === 'category' ? 'Category' : 'Quick link'}</span>
                                        </div>
                                        <i className="fa-solid fa-arrow-right suggestion-arrow"></i>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="search-input-button" onClick={handleEntrySystem}>
                        ENTRY SYSTEM<span className="arrow">🡥</span>
                    </button>
                    <button className="burger-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <i className="fa-solid fa-bars"></i>
                    </button>
                </div>
            </header>

            <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
                <ul>
                    {navItems.map((item, i) => (
                        <li key={i} className={pathname === item.href ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>
                            <Link href={item.href}>{item.label}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default Header;