import Header from '@/components/Header/Header';
import ErrorPage from '@/components/ErrorPage/ErrorPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
    title: '404 - Target Not Found | ESC Shooting',
};

export default function NotFound() {
    return (
        <>
            <Header />
            <main>
                <ErrorPage />
            </main>
            <Footer />
        </>
    );
}