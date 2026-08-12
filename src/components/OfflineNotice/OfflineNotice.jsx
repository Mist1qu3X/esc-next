'use client';
import { useEffect, useState } from 'react';
import './OfflineNotice.css';

// Плашка «нет сети» — глобальное офлайн-состояние (по умолчанию нигде не рисовалось).
export default function OfflineNotice() {
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const update = () => setOffline(!navigator.onLine);
        update();
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);

    if (!offline) return null;

    return (
        <div className="offline-notice" role="status" aria-live="polite">
            <i className="fa-solid fa-wifi offline-notice-icon"></i>
            <span className="offline-notice-text">You&apos;re offline — some content may be unavailable.</span>
            <button className="offline-notice-retry" onClick={() => window.location.reload()}>Retry</button>
        </div>
    );
}
