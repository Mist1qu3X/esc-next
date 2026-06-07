'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MustSeeAction.css';
import config from '@/lib/config';

const MustSeeAction = () => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await axios.get(
                    `${config.API_URL}/api/videos?populate=*&pagination[limit]=3`
                );
                setVideos(response.data.data);
            } catch (error) {
                console.error('Ошибка загрузки видео:', error);
            }
        };
        fetchVideos();
    }, []);

    const handleMore = () => console.log('clicked: MORE');
    const handleWatch = (video) => console.log('clicked: WATCH', video.title);

    return (
        <section className="must-see-action">
            <div className="action-naming">
                <p className="action-title">MUST-SEE ACTION</p>
                <div className="action-line"></div>
                <div className="action-spacer"></div>
                <button className="action-more-btn" onClick={handleMore}>MORE &gt;</button>
            </div>
            <div className="action-container">
                {videos.map((video, index) => {
                    const { title, category, description, thumbnail } = video;
                    // Исправление: формируем полный URL для миниатюры видео
                    const thumbnailUrl = thumbnail?.url 
                        ? `${config.API_URL}${thumbnail.url}` 
                        : null;
                    
                    return (
                        <div className="video-container" key={video.id}>
                            <p className="number-video">{String(index + 1).padStart(2, '0')}</p>
                            <div className="video-image-wrapper">
                                {thumbnailUrl && (
                                    <img src={thumbnailUrl} alt={title} />
                                )}
                                <div className="play-icon">
                                    <i className="fa-solid fa-play"></i>
                                </div>
                            </div>
                            <div className="video-info">
                                <p className="title-video">{category}</p>
                                <p className="text-information">{description}</p>
                            </div>
                            <button className="watch-btn" onClick={() => handleWatch(video)}>
                                WATCH &gt;
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default MustSeeAction;