'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './Footer.css';

const Footer = () => {
    const [socialLinks, setSocialLinks] = useState([]);

    useEffect(() => {
        const fetchSocialLinks = async () => {
            try {
                const res = await axios.get(
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
                        const iconUrl = icon?.url ? `${config.API_URL}${icon.url}` : null;
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
                    <a href="#">PRIVACY POLICY</a>
                    <a href="#">TERMS OF USE</a>
                    <a href="#">COOKIE SETTINGS</a>
                    <a href="#">SITEMAP</a>
                </div>
            </div>

            <div className="other-links-container">
                <div className="logo-inf">
                    <div className="logo-wrapper">
                        <img src="/img/Logo_full.png" alt="European Shooting Confederation" className="logo-full" />
                    </div>
                    <p className="info-corp">
                        The official governing body for precision shooting sport in Europe.
                    </p>
                </div>
                <div className="the-esc">
                    <h4 className="title-links">THE ESC</h4>
                    <a href="#">About ESC</a>
                    <a href="#">Governance</a>
                    <a href="#">Executive Committee</a>
                    <a href="#">Technical Committee</a>
                    <a href="#">Contact</a>
                </div>
                <div className="media">
                    <h4 className="title-links">MEDIA</h4>
                    <a href="#">News</a>
                    <a href="#">Videos</a>
                    <a href="#">Photos</a>
                    <a href="#">Press Releases</a>
                    <a href="#">Newsletter</a>
                </div>
                <div className="related-links">
                    <h4 className="title-links">RELATED LINKS</h4>
                    <a href="#">Events Calendar</a>
                    <a href="#">Results & Rankings</a>
                    <a href="#">Documents Library</a>
                    <a href="#">Member Federations</a>
                    <a href="#">Entry System 🡥</a>
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