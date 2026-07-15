'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import './LatestFromEsc.css';
import config from '@/lib/config';

const LatestFromEsc = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get(
                    `${config.API_URL}/api/news-items?populate=*&sort=date:desc&pagination[limit]=4`
                );

                // Проверяем структуру ответа и оставляем максимум 4 новости
                let items = [];
                if (response.data && response.data.data) {
                    items = response.data.data;
                } else if (Array.isArray(response.data)) {
                    items = response.data;
                } else {
                    console.warn('Unexpected response structure:', response.data);
                }
                setNews(items.slice(0, 4));
                setLoading(false);
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    response: error.response?.data,
                    status: error.response?.status
                });
                setError(error.message);
                setNews([]);
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const handleMore = () => {
        router.push('/media#latest-news');
    };

    if (loading) {
        return (
            <section className="lastest-from-esc" id="latest-news">
                <div className="section-naming">
                    <p className="section-title">LATEST FROM ESC</p>
                    <div className="section-line"></div>
                    <div className="section-spacer"></div>
                    <button className="more-btn" onClick={handleMore}>MORE &gt;</button>
                </div>
                <div className="lastest-news-container">
                    <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center' }}>
                        Loading news...
                    </p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="lastest-from-esc" id="latest-news">
                <div className="section-naming">
                    <p className="section-title">LATEST FROM ESC</p>
                    <div className="section-line"></div>
                    <div className="section-spacer"></div>
                    <button className="more-btn" onClick={handleMore}>MORE &gt;</button>
                </div>
                <div className="lastest-news-container">
                    <p style={{ color: 'red', padding: '40px', textAlign: 'center' }}>
                        Error loading news: {error}
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="lastest-from-esc" id="latest-news">
            <div className="section-naming">
                <p className="section-title">LATEST FROM ESC</p>
                <div className="section-line"></div>
                <div className="section-spacer"></div>
                <button className="more-btn" onClick={handleMore}>MORE &gt;</button>
            </div>
            <div className="lastest-news-container">
                {news && news.length > 0 ? (
                    news.map((item) => {
                        const { title, theme, date, image, slug } = item;
                        const imageUrl = image?.url 
                            ? `${config.API_URL}${image.url}` 
                            : null;
                        // Используем documentId или id если slug отсутствует
                        const linkSlug = slug || item.documentId || item.id;
                        
                        return (
                            <div 
                                className="news" 
                                key={item.id} 
                                onClick={() => router.push(`/media/${linkSlug}`)} 
                                style={{ cursor: 'pointer' }}
                            >
                                {imageUrl && <img src={imageUrl} alt={title} />}
                                <p className="theme">{theme || 'NEWS'}</p>
                                <p className="description">{title}</p>
                                <p className="date">
                                    {new Date(date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <p style={{ color: 'rgba(255,255,255,0.5)', padding: '40px', textAlign: 'center' }}>
                        No news available
                    </p>
                )}
            </div>
        </section>
    );
};

export default LatestFromEsc;