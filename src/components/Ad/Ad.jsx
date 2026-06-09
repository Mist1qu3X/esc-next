'use client';
import React from 'react';
import './Ad.css';

const Ad = () => {
    // Массив с данными логотипов (url изображения и ссылка для перехода)
    const logos = [
        { src: '/img/sponsors-1.svg', alt: 'sponsors-1', url: 'https://example.com/sponsor1' },
        { src: '/img/sponsors-2.svg', alt: 'sponsors-2', url: 'https://example.com/sponsor2' },
        { src: '/img/sponsors-3.svg', alt: 'sponsors-3', url: 'https://example.com/sponsor3' },
        { src: '/img/partners-1.svg', alt: 'partners-1', url: 'https://example.com/partner1' },
        { src: '/img/partners-2.svg', alt: 'partners-2', url: 'https://example.com/partner2' },
        { src: '/img/partners-3.svg', alt: 'partners-3', url: 'https://example.com/partner3' },
        { src: '/img/partners-4.svg', alt: 'partners-4', url: 'https://example.com/partner4' },
        { src: '/img/partners-5.svg', alt: 'partners-5', url: 'https://example.com/partner5' },
    ];

    const handleLogoClick = (url) => {
        if (url) {
            window.open(url, '_blank'); // Открывает в новой вкладке
            // Или если нужно открыть в той же вкладке:
            // window.location.href = url;
        }
    };

    return (
        <section className="ad">
            <div className="ad-divider"></div>
            <div className="ad-content">
                <div className="ad-logos">
                    {logos.map((logo, index) => (
                        <img
                            key={index}
                            src={logo.src}
                            alt={logo.alt}
                            onClick={() => handleLogoClick(logo.url)}
                            style={{ cursor: 'pointer' }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Ad;