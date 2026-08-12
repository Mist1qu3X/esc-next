'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './CookieConsent.css';

const KEY = 'esc-cookie-consent';

// Баннер согласия на cookies (ТЗ 7.4). Закреплён ВНИЗУ экрана — не перекрывает hero с заголовком/кнопками.
// Выбор хранится в localStorage. Ссылка «Cookie Settings» в футере открывает его заново (событие open-cookie-settings).
export default function CookieConsent() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            if (!localStorage.getItem(KEY)) setOpen(true);
        } catch { /* localStorage недоступен — не показываем */ }
        const reopen = () => setOpen(true);
        window.addEventListener('open-cookie-settings', reopen);
        return () => window.removeEventListener('open-cookie-settings', reopen);
    }, []);

    const choose = (value) => {
        try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
        setOpen(false);
        // Здесь позже подключается аналитика — только если value === 'accepted'.
    };

    if (!open) return null;

    return (
        <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
            <div className="cookie-banner-inner">
                <div className="cookie-banner-text">
                    <strong>We use cookies</strong>
                    <span>
                        Essential cookies keep the site working. With your consent we may also use
                        analytics cookies to improve it. See our{' '}
                        <Link href="/privacy">Privacy Policy</Link> and{' '}
                        <Link href="/cookies">Cookie Policy</Link>.
                    </span>
                </div>
                <div className="cookie-banner-actions">
                    <button className="cookie-btn cookie-btn-reject" onClick={() => choose('rejected')}>
                        Reject non-essential
                    </button>
                    <button className="cookie-btn cookie-btn-accept" onClick={() => choose('accepted')}>
                        Accept all
                    </button>
                </div>
            </div>
        </div>
    );
}
