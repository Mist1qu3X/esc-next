'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import './Spotlight.css';
import config from '@/lib/config';

const Spotlight = () => {
    const [miniNews, setMiniNews] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchSpotlights = async () => {
            try {
                const response = await axios.get(
                    `${config.API_URL}/api/spotlights?populate=*&pagination[limit]=4`
                );
                setMiniNews(response.data.data);
            } catch (error) { 
                console.error('Ошибка загрузки:', error); 
            }
        };
        fetchSpotlights();
    }, []);

    const handleMore = () => {
        router.push('/media#spotlight');
    };

    const handleSpotlightClick = (slug) => {
        if (slug) {
            router.push(`/media/${slug}`);
        }
    };

    return (
        <section className="esc-spotlight" id="spotlight">
            <div className="spotlight-naming">
                <p className="spotlight-title">ESC SPOTLIGHT</p>
                <div className="spotlight-line"></div>
                <div className="spotlight-spacer"></div>
                <button className="spotlight-more-btn" onClick={handleMore}>MORE &gt;</button>
            </div>
            <div className="spotlight-container">
                {miniNews.map((item) => {
                    const { title, theme, image, slug } = item;
                    const imageUrl = image?.url 
                        ? `${config.API_URL}${image.url}` 
                        : null;
                    return (
                        <div 
                            className="mini-news-container" 
                            key={item.id}
                            onClick={() => handleSpotlightClick(slug)}
                            style={{ cursor: 'pointer' }}
                        >
                            {imageUrl && <img src={imageUrl} alt={title} />}
                            <div className="mini-news-content">
                                <p className="theme">{theme}</p>
                                <p className="text-info">{title}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default Spotlight;