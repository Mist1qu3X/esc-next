import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import './LegalPage.css';

// Обёртка для правовых страниц (Privacy / Terms / Cookie). Контент — заглушка-шаблон,
// финальный юридический текст предоставляет заказчик (пометка «Draft» видна на странице).
export default function LegalPage({ title, updated, children }) {
    return (
        <>
            <Header />
            <main className="legal-page">
                <div className="legal-container">
                    <h1 className="legal-title">{title}</h1>
                    {updated && <p className="legal-updated">Last updated: {updated}</p>}
                    <div className="legal-note">Draft template — final wording to be provided / reviewed by ESC legal.</div>
                    <div className="legal-content">{children}</div>
                </div>
            </main>
            <Footer />
        </>
    );
}
