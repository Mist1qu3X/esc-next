'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import './FeaturedDocuments.css';
import config from '@/lib/config';
import { downloadFile } from '@/lib/download';
import { cachedGet } from '@/lib/apiCache';

const absUrl = (file) =>
    file?.url ? (file.url.startsWith('http') ? file.url : `${config.API_URL}${file.url}`) : null;

const FeaturedDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [availability, setAvailability] = useState({}); // absUrl -> boolean (false = битая/404)
    const router = useRouter();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await cachedGet(
                    `${config.API_URL}/api/docs?populate=*&sort=date:desc&pagination[limit]=4`
                );
                const docs = response.data.data || [];
                setDocuments(docs);

                // Серверная проверка доступности файлов (обходит CORS S3)
                const urls = docs.map((d) => absUrl(d.file)).filter(Boolean);
                if (urls.length) {
                    try {
                        const r = await axios.post('/api/doc-availability', { urls });
                        setAvailability(r.data?.results || {});
                    } catch {
                        // проверка недоступна — остаёмся оптимистичными (показываем download)
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки документов:', error);
            } finally {
                setLoaded(true);
            }
        };
        fetchDocuments();
    }, []);

    const handleMore = () => router.push('/documents');

    const handleDownload = (doc) => {
        const url = absUrl(doc.file);
        if (url) downloadFile(url, `${doc.title || 'document'}${doc.file?.ext || '.pdf'}`);
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
                {documents.length > 0 ? (
                    documents.map((doc) => {
                        const { title, theme, version, file, fileSize } = doc;
                        const url = absUrl(file);
                        // Недоступно, если файла нет ИЛИ серверная проверка вернула false (404/битая)
                        const available = !!url && availability[url] !== false;
                        return (
                            <div
                                className={`featured-docs-card ${available ? '' : 'is-unavailable'}`}
                                key={doc.id}
                                onClick={available ? () => handleDownload(doc) : undefined}
                                role={available ? 'button' : undefined}
                                tabIndex={available ? 0 : undefined}
                                onKeyDown={available ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDownload(doc); } } : undefined}
                            >
                                <div className="featured-docs-card-header">
                                    <i className="fa-regular fa-file-lines"></i>
                                    <p className="featured-docs-version">{version}</p>
                                </div>
                                <p className="featured-docs-theme">{theme}</p>
                                <p className="featured-docs-card-title">{title}</p>
                                {available ? (
                                    <div className="featured-docs-download-area" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                                        <i className="fa-solid fa-download"></i>
                                        <p className="featured-docs-download-text">
                                            download PDF{fileSize ? ` · ${fileSize}` : ''}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="featured-docs-download-area is-unavailable" aria-disabled="true" title="Файл ещё не загружен или ссылка недоступна">
                                        <i className="fa-regular fa-clock"></i>
                                        <p className="featured-docs-download-text">Not available yet</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="featured-docs-empty">
                        {loaded ? 'No documents yet' : 'Loading…'}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FeaturedDocuments;
