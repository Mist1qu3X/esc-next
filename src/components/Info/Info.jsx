'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/lib/config';
import './Info.css';

const Info = () => {
    const [newsCards, setNewsCards] = useState([]);
    const [championship, setChampionship] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Загружаем новости
                const newsResponse = await axios.get(
                    `${config.API_URL}/api/news-items?populate=*&pagination[limit]=3&sort=date:desc`
                );
                setNewsCards(newsResponse.data.data);

                // Загружаем чемпионат
                const champResponse = await axios.get(
                    `${config.API_URL}/api/championships?populate=*`
                );
                if (champResponse.data.data.length > 0) {
                    setChampionship(champResponse.data.data[0]);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleViewEvent = () => console.log('clicked: VIEW EVENT');
    const handleAllEvents = () => console.log('clicked: ALL EVENTS');

    if (loading) return <section className="info-section"></section>;

    return (
        <section className="info-section">
            <div className="info-section-content">
                <p className="info-section-nameing">
                    {championship?.title?.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < championship.title.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </p>

                <div className="info-section-event-details">
                    <div className="info-section-location-wrapper">
                        <i className="fa-solid fa-location-dot"></i>
                        <p className="info-section-location">{championship?.location}</p>
                    </div>
                    <span className="info-section-event-separator">•</span>
                    <div className="info-section-date-wrapper">
                        <i className="fa-regular fa-calendar"></i>
                        <p className="info-section-date">{championship?.dateRange}</p>
                    </div>
                </div>

                <div className="info-section-buttons-wrapper">
                    <button className="info-section-btn-view-event" onClick={handleViewEvent}>
                        VIEW EVENT &gt;
                    </button>
                    <button className="info-section-btn-all-events" onClick={handleAllEvents}>
                        ALL EVENTS
                    </button>
                </div>
            </div>

            <div className="info-section-news-content">
                <div className="info-section-news-container">
                    {newsCards.map((card, index) => {
                        const { theme, description, image } = card;
                        const imageUrl = image?.url?.startsWith('http') 
                            ? image.url 
                            : `${config.API_URL}${image?.url}`;
                        
                        return (
                            <div 
                                key={card.id}
                                className={`info-section-news-card info-section-news-card-${index + 1}`}
                                style={imageUrl ? { 
                                    backgroundImage: `url(${imageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                } : {}}
                            >
                                <h4 className="info-section-news-title">{theme}</h4>
                                <p className="info-section-news-excerpt">{description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Info;