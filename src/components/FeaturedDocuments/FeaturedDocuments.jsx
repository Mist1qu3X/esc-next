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
        <section className="featured-documents">
            <div className="documents-naming">
                <p className="documents-title">FEATURED DOCUMENTS</p>
                <div className="documents-line"></div>
                <div className="documents-spacer"></div>
                <button className="documents-more-btn" onClick={handleMore}>MORE &gt;</button>
            </div>
            <div className="document-container">
                {documents.map((doc) => {
                    const { title, theme, version, file } = doc;
                    return (
                        <div className="document" key={doc.id}>
                            <div className="doc-header">
                                <i className="fa-regular fa-file-lines"></i>
                                <p className="version">{version}</p>
                            </div>
                            <p className="theme">{theme}</p>
                            <p className="document-title">{title}</p>
                            <div className="download-area" onClick={() => handleDownload(doc)}>
                                <i className="fa-solid fa-download"></i>
                                <p className="download-text">download PDF</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default FeaturedDocuments;