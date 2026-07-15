'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './Ad.css';

const Ad = () => {
    const [logos, setLogos] = useState([]);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const res = await axios.get(
                    `${config.API_URL}/api/partners?populate=*&sort=order:asc`
                );
                setLogos(res.data.data || []);
            } catch (error) {
                console.error('Ошибка загрузки партнёров:', error);
            }
        };
        fetchPartners();
    }, []);

    const handleLogoClick = (url) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    if (logos.length === 0) return null;

    // Дублируем список для бесшовной прокрутки бегущей строки
    const marqueeLogos = [...logos, ...logos];

    return (
        <section className="ad">
            <div className="ad-divider"></div>
            <div className="ad-content">
                <div className="ad-marquee">
                    <div className="ad-track">
                        {marqueeLogos.map((item, index) => {
                            const { name, url, logo: image } = item;
                            const imageUrl = image?.url ? `${config.API_URL}${image.url}` : null;
                            if (!imageUrl) return null;
                            return (
                                <img
                                    key={index}
                                    src={imageUrl}
                                    alt={name}
                                    onClick={() => handleLogoClick(url)}
                                    style={{ cursor: url ? 'pointer' : 'default' }}
                                    aria-hidden={index >= logos.length ? 'true' : undefined}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Ad;
