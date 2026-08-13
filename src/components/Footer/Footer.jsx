'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cachedGet } from '@/lib/apiCache';
import config from '@/lib/config';
import './Footer.css';

const Footer = () => {
    const [socialLinks, setSocialLinks] = useState([]);

    useEffect(() => {
        const fetchSocialLinks = async () => {
            try {
                const res = await cachedGet(
                    `${config.API_URL}/api/social-links?populate=*&sort=order:asc`
                );
                setSocialLinks(res.data.data || []);
            } catch (error) {
                console.error('Ошибка загрузки соц. сетей:', error);
            }
        };
        fetchSocialLinks();
    }, []);

    return (
        <footer className="footer">
            <div className="social-container">
                <div className="social-links">
                    <p className="social-text">FOLLOW ESC</p>
                    {socialLinks.map((link) => {
                        const { id, platform, url, icon } = link;
                        const iconUrl = icon?.url ? (icon.url.startsWith('http') ? icon.url : `${config.API_URL}${icon.url}`) : null;
                        return (
                            <a
                                key={id}
                                href={url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-icon-link"
                                aria-label={platform}
                            >
                                {iconUrl && <img src={iconUrl} alt={platform} />}
                            </a>
                        );
                    })}
                </div>
                <div className="reading-links">
                    <Link href="/privacy">PRIVACY POLICY</Link>
                    <Link href="/terms">TERMS OF USE</Link>
                    <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('open-cookie-settings')); }}>COOKIE SETTINGS</a>
                    <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">SITEMAP</a>
                </div>
            </div>

            <div className="other-links-container">
                <div className="logo-inf">
                    <div className="logo-wrapper">
                        <img src="/img/Frame%20175.svg" alt="European Shooting Confederation" className="logo-full" />
                    </div>
                    <p className="info-corp">
                        The official governing body for precision shooting sport in Europe.
                    </p>
                </div>
                <div className="the-esc">
                    <h4 className="title-links">THE ESC</h4>
                    <Link href="/discover">About ESC</Link>
                    <Link href="/discover#governance">Governance</Link>
                    <Link href="/discover#presidium">Presidium</Link>
                    <Link href="/discover#committees">Technical Committee</Link>
                    <Link href="/contacts">Contact</Link>
                </div>
                <div className="media">
                    <h4 className="title-links">MEDIA</h4>
                    <Link href="/media?filter=NEWS">News</Link>
                    <Link href="/media?filter=VIDEOS">Videos</Link>
                    <Link href="/media?filter=PHOTO">Photos</Link>
                    <Link href="/media?filter=PRESS RELEASES">Press Releases</Link>
                    <Link href="/media">Newsletter</Link>
                </div>
                <div className="related-links">
                    <h4 className="title-links">RELATED LINKS</h4>
                    <Link href="/events">Events Calendar</Link>
                    <Link href="/results">Results & Rankings</Link>
                    <Link href="/documents">Documents Library</Link>
                    <Link href="/members">Member Federations</Link>
                    <a href="https://esc-entry.eu" target="_blank" rel="noopener noreferrer" className="footer-entry-link">Entry System<i className="fa-solid fa-arrow-up-right-from-square footer-entry-arrow"></i></a>
                </div>
            </div>

            <div className="copyright-layer">
                <p className="copyright-text">
                    © 2026 European Shooting Confederation. All rights reserved.
                </p>
                <p className="right-copyright-text">
                    <span className="blue-dot"></span> ESC Official Website
                </p>
            </div>
        </footer>
    );
};

export default Footer;