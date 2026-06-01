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

        if (loading) return <section className="info">Загрузка...</section>;

        return (
            <section className="info">
                <div className="info-content">
                    <p className="nameing">
                        {championship?.title?.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                {i < championship.title.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </p>

                    <div className="event-details">
                        <div className="location-wrapper">
                            <i className="fa-solid fa-location-dot"></i>
                            <p className="location">{championship?.location}</p>
                        </div>
                        <span className="event-separator">•</span>
                        <div className="date-wrapper">
                            <i className="fa-regular fa-calendar"></i>
                            <p className="date">{championship?.dateRange}</p>
                        </div>
                    </div>

                    <div className="buttons-wrapper">
                        <button className="btn-view-event" onClick={handleViewEvent}>
                            VIEW EVENT &gt;
                        </button>
                        <button className="btn-all-events" onClick={handleAllEvents}>
                            ALL EVENTS
                        </button>
                    </div>
                </div>

                <div className="news-content">
                    <div className="news-container">
                        {newsCards.map((card, index) => {
                            const { theme, description, image } = card;
                            const imageUrl = image?.url?.startsWith('http') 
                                ? image.url 
                                : `${config.API_URL}${image?.url}`;
                            
                            return (
                                <div 
                                    key={card.id}
                                    className={`news-card news-card-${index + 1}`}
                                    style={imageUrl ? { 
                                        backgroundImage: `url(${imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    } : {}}
                                >
                                    <h4 className="news-title">{theme}</h4>
                                    <p className="news-excerpt">{description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        );
    };

    export default Info;