'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { label: 'Home', href: '/' },
        { label: 'About Us', href: '/discover' },
        { label: 'Calendar', href: '/events' },
        { label: 'Results & Ranking', href: '/results' },
        { label: 'Documents', href: '/documents' },
        { label: 'Media', href: '/media' },
        { label: 'Contacts', href: '/members' },
    ];

    useEffect(() => {
        const handleClickOutside = (e) => {
            const searchWrapper = document.querySelector('.search-wrapper');
            const searchIcon = document.querySelector('.search-icon');
            if (searchWrapper && !searchWrapper.contains(e.target) && searchIcon && !searchIcon.contains(e.target)) {
                setIsSearchActive(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <>
            <header className="header">
                <Link href="/" className="logospace">
                    <img src="/img/logo.svg" alt="ESC Logo" />
                    <h1>ESC</h1>
                    <span className="full-title">European Shooting Confederation</span>
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

                <div className="search-bar-container">
                    <div className={`search-wrapper ${isSearchActive ? 'active' : ''}`}>
                        <i 
                            className="fa-solid fa-magnifying-glass search-icon"
                            onClick={() => setIsSearchActive(!isSearchActive)}
                        ></i>
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search..."
                            onKeyDown={(e) => e.key === 'Escape' && setIsSearchActive(false)}
                        />
                    </div>
                    <button className="search-input-button" onClick={() => console.log('ENTRY SYSTEM')}>
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