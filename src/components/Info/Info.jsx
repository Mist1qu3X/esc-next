'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import config from '@/lib/config';
import './Info.css';

const Info = () => {
    const [championship, setChampionship] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
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

    const handleViewEvent = () => {
        if (championship?.slug) {
            router.push(`/events/${championship.slug}`);
        }
    };

    const handleAllEvents = () => {
        router.push('/events');  // Просто переход на страницу событий, без hash
    };

    if (loading) return <section className="info-section"></section>;

    return (
        <section className="info-section">
            <div className="info-section-content">
                <p className="info-section-nameing">
                    {championship?.title?.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < (championship?.title?.split('\n').length || 0) - 1 && <br />}
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
        </section>
    );
};

export default Info;