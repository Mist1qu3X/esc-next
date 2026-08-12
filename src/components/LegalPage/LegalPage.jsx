import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import './LegalPage.css';

// Обёртка для правовых страниц (Privacy / Terms / Cookie).
// draft=true — показывает пометку «черновик, требует проверки юристами ESC»
// (для Terms/Cookie, которых нет отдельным официальным документом).
export default function LegalPage({ title, updated, draft = false, children }) {
    return (
        <>
            <Header />
            <main className="legal-page">
                <div className="legal-container">
                    <h1 className="legal-title">{title}</h1>
                    {updated && <p className="legal-updated">Last updated: {updated}</p>}
                    {draft && <div className="legal-note">Draft template — final wording to be reviewed by ESC legal.</div>}
                    <div className="legal-content">{children}</div>
                </div>
            </main>
            <Footer />
        </>
    );
}
