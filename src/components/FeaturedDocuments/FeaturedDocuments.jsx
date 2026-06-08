'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FeaturedDocuments.css';
import config from '@/lib/config';

const FeaturedDocuments = () => {
    const [documents, setDocuments] = useState([]);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await axios.get(
                    `${config.API_URL}/api/docs?populate=*&pagination[limit]=4`
                );
                setDocuments(response.data.data);
            } catch (error) {
                console.error('Ошибка загрузки документов:', error);
            }
        };
        fetchDocuments();
    }, []);

    const handleMore = () => console.log('clicked: MORE');
    
    const handleDownload = (doc) => {
        const file = doc.file;
        if (file && file.url) {
            window.open(`${config.API_URL}${file.url}`, '_blank');
        } else {
            console.log('Файл не найден');
        }
    };

    return (
        <section className="featured-docs-section">
            <div className="featured-docs-header">
                <p className="featured-docs-title">FEATURED DOCUMENTS</p>
                <div className="featured-docs-line"></div>
                <div className="featured-docs-spacer"></div>
                <button className="featured-docs-more-btn" onClick={handleMore}>MORE &gt;</button>
            </div>
            <div className="featured-docs-container">
                {documents.map((doc) => {
                    const { title, theme, version, file } = doc;
                    return (
                        <div className="featured-docs-card" key={doc.id}>
                            <div className="featured-docs-card-header">
                                <i className="fa-regular fa-file-lines"></i>
                                <p className="featured-docs-version">{version}</p>
                            </div>
                            <p className="featured-docs-theme">{theme}</p>
                            <p className="featured-docs-card-title">{title}</p>
                            <div className="featured-docs-download-area" onClick={() => handleDownload(doc)}>
                                <i className="fa-solid fa-download"></i>
                                <p className="featured-docs-download-text">download PDF</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default FeaturedDocuments;