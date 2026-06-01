'use client';
import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="social-container">
                <div className="social-links">
                    <p className="social-text">FOLLOW ESC</p>
                    <i className="fa-brands fa-instagram"></i>
                    <i className="fa-brands fa-twitter"></i>
                    <i className="fa-brands fa-facebook"></i>
                    <i className="fa-brands fa-youtube"></i>
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
                        <img src="/img/logo.svg" alt="ESC Logo" />
                        <h4>ESC</h4>
                        <span className="full-title">European Shooting Confederation</span>
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