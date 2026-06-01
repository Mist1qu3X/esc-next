import Link from 'next/link';
import './ErrorPage.css';

const ErrorPage = () => {
    const popularLinks = [
        { label: 'Event Calendar', href: '/events' },
        { label: 'Results & Ranking', href: '/results' },
        { label: 'Documents', href: '/documents' },
        { label: 'Member Federations', href: '/members' },
        { label: 'Media & News', href: '/media' },
    ];

    return (
        <section className="error-page">
            <div className="target-icon">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
                <div className="circle circle-4"></div>
                <div className="circle circle-5"></div>
                <div className="circle circle-6"></div>
                <span className="line line-top"></span>
                <span className="line line-right"></span>
                <span className="line line-bottom"></span>
                <span className="line line-left"></span>
            </div>
            <div className="center-dot"></div>
            <div className="error-content">
                <div className="glow-line"></div>
                <h1 className="error-title">TARGET NOT FOUND</h1>
                <p className="error-text">
                    The page you're looking for has missed the mark.<br />
                    It may have been moved, removed, or never existed.
                </p>
                <div className="error-buttons">
                    <Link href="/" className="back-home-btn">
                        <i className="fa-solid fa-arrow-left"></i> Back to Home
                    </Link>
                    <Link href="/events" className="view-events-btn">
                        View Events <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                </div>
            </div>
            <div className="popular-divider"></div>
            <div className="popular-pages">
                <p className="popular-title">Popular Pages</p>
                <div className="popular-links">
                    {popularLinks.map((link) => (
                        <Link key={link.href} href={link.href} className="popular-link">
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ErrorPage;