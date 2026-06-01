'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LatestFromEsc.css';
import config from '@/lib/config';

const LatestFromEsc = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await axios.get(
                    `${config.API_URL}/api/news-items?populate=*&sort=date:desc&pagination[limit]=4`
                );
                setNews(response.data.data);
                setLoading(false);
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const handleMore = () => console.log('clicked: MORE');

    if (loading) return <section className="lastest-from-esc"></section>;

    return (
        <section className="lastest-from-esc">
            <div className="section-naming">
                <p className="section-title">LATEST FROM ESC</p>
                <div className="section-line"></div>
                <div className="section-spacer"></div>
                <button className="more-btn" onClick={handleMore}>MORE &gt;</button>
            </div>
            <div className="lastest-news-container">
                {news.map((item) => {
                    const { title, theme, date, image } = item;
                    const imageUrl = image?.url;
                    
                    return (
                        <div className="news" key={item.id}>
                            {imageUrl && (
                                <img src={imageUrl} alt={title} />
                            )}
                            <p className="theme">{theme}</p>
                            <p className="description">{title}</p>
                            <p className="date">
                                {new Date(date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default LatestFromEsc;