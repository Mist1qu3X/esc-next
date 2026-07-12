'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import './Spotlight.css';
import config from '@/lib/config';

const Spotlight = () => {
    const [miniNews, setMiniNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSpotlights = async () => {
            try {
                console.log('Fetching spotlights from:', `${config.API_URL}/api/spotlight-items?populate=*&pagination[limit]=4`);
                
                const response = await axios.get(
                    `${config.API_URL}/api/spotlight-items?populate=*&pagination[limit]=4`
                );
                
                console.log('Spotlights response:', response.data);
                
                // Проверяем структуру ответа
                if (response.data && response.data.data) {
                    setMiniNews(response.data.data);
                } else if (Array.isArray(response.data)) {
                    setMiniNews(response.data);
                } else {
                    setMiniNews([]);
                }
                setLoading(false);
            } catch (error) { 
                console.error('Ошибка загрузки спотлайтов:', error);
                setMiniNews([]);
                setLoading(false);
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

    if (loading) {
        return (
            <section className="esc-spotlight" id="spotlight">
                <div className="spotlight-naming">
                    <p className="spotlight-title">ESC SPOTLIGHT</p>
                    <div className="spotlight-line"></div>
                    <div className="spotlight-spacer"></div>
                    <button className="spotlight-more-btn" onClick={handleMore}>MORE &gt;</button>
                </div>
                <div className="spotlight-container">
                    <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center' }}>
                        Loading spotlight...
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="esc-spotlight" id="spotlight">
            <div className="spotlight-naming">
                <p className="spotlight-title">ESC SPOTLIGHT</p>
                <div className="spotlight-line"></div>
                <div className="spotlight-spacer"></div>
                <button className="spotlight-more-btn" onClick={handleMore}>MORE &gt;</button>
            </div>
            <div className="spotlight-container">
                {miniNews && miniNews.length > 0 ? (
                    miniNews.map((item) => {
                        const { title, theme, image, slug } = item;
                        const imageUrl = image?.url 
                            ? `${config.API_URL}${image.url}` 
                            : null;
                        const linkSlug = slug || item.documentId || item.id;
                        
                        return (
                            <div 
                                className="mini-news-container" 
                                key={item.id}
                                onClick={() => handleSpotlightClick(linkSlug)}
                                style={{ cursor: 'pointer' }}
                            >
                                {imageUrl && <img src={imageUrl} alt={title} />}
                                <div className="mini-news-content">
                                    <p className="theme">{theme || 'SPOTLIGHT'}</p>
                                    <p className="text-info">{title}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center' }}>
                        No spotlight items available
                    </p>
                )}
            </div>
        </section>
    );
};

export default Spotlight;