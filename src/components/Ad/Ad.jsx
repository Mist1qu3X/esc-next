'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './Ad.css';

const Ad = () => {
    const [logos, setLogos] = useState([]);
    // Сколько раз повторить список. Всегда чётное — половина трека == вторая половина
    // (нужно для бесшовного сдвига на -50%). Подбирается под ширину экрана.
    const [copies, setCopies] = useState(2);
    const marqueeRef = useRef(null);
    const trackRef = useRef(null);

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

    // Дублируем логотипы столько раз, чтобы каждая половина трека была шире вьюпорта.
    // Иначе при малом числе логотипов после -50% появляется пустой «провал».
    useEffect(() => {
        if (!logos.length) return;
        const marquee = marqueeRef.current;
        const track = trackRef.current;
        if (!marquee || !track) return;

        const recompute = () => {
            const oneSetWidth = track.scrollWidth / copies; // ширина одного набора логотипов
            if (!oneSetWidth) return;
            // Половина трека (copies/2 наборов) должна покрывать вьюпорт → copies >= 2*ceil(view/set)
            const needed = 2 * Math.max(1, Math.ceil(marquee.clientWidth / oneSetWidth));
            setCopies((prev) => (prev === needed ? prev : needed));
        };

        const ro = new ResizeObserver(recompute);
        ro.observe(marquee);
        ro.observe(track);
        recompute();
        return () => ro.disconnect();
    }, [logos, copies]);

    const handleLogoClick = (url) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    if (logos.length === 0) return null;

    const marqueeLogos = Array.from({ length: copies }).flatMap(() => logos);
    // Длительность пропорциональна числу копий — визуальная скорость остаётся постоянной
    const animationDuration = `${20 * copies}s`;

    return (
        <section className="ad">
            <div className="ad-divider"></div>
            <div className="ad-content">
                <div className="ad-marquee" ref={marqueeRef}>
                    <div className="ad-track" ref={trackRef} style={{ animationDuration }}>
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
