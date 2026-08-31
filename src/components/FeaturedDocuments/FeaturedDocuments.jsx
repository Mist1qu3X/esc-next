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
    const [availability, setAvailability] = useState({});
    const router = useRouter();

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                // 1) Сначала — документы с включённым тумблером ShowOnHome.
                //    Порядок задаётся в админке полем homeOrder (больше число = выше);
                //    при равном/нулевом homeOrder — по дате (свежие выше).
                const featuredRes = await cachedGet(
                    `${config.API_URL}/api/docs?filters[ShowOnHome][$eq]=true&populate=*&sort=homeOrder:desc,date:desc&pagination[limit]=4`
                );
                let docs = featuredRes.data.data || [];

                // 2) Фолбэк: если ни у одного документа тумблер не включён —
                //    показываем свежие по дате добавления (createdAt)
                if (docs.length === 0) {
                    const recentRes = await cachedGet(
                        `${config.API_URL}/api/docs?populate=*&sort=createdAt:desc&pagination[limit]=4`
                    );
                    docs = recentRes.data.data || [];
                }

                setDocuments(docs);

                // Проверка доступности файлов
                const urls = docs.map((d) => absUrl(d.file)).filter(Boolean);
                if (urls.length) {
                    try {
                        const r = await axios.post('/api/doc-availability', { urls });
                        setAvailability(r.data?.results || {});
                    } catch {
                        // проверка недоступна
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

    // Если документов нет, показываем пустое состояние
    if (loaded && documents.length === 0) {
        return (
            <section className="featured-docs-section">
                <div className="featured-docs-header">
                    <p className="featured-docs-title">FEATURED DOCUMENTS</p>
                    <div className="featured-docs-line"></div>
                    <div className="featured-docs-spacer"></div>
                    <button className="featured-docs-more-btn" onClick={handleMore}>MORE &gt;</button>
                </div>
                <div className="featured-docs-container">
                    <div className="featured-docs-empty">
                        <i className="fa-regular fa-folder-open featured-docs-empty-icon"></i>
                        <p className="featured-docs-empty-title">No documents yet</p>
                    </div>
                </div>
            </section>
        );
    }

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
                    const { title, theme, version, file, fileSize } = doc;
                    const url = absUrl(file);
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
                })}
            </div>
        </section>
    );
};

export default FeaturedDocuments;