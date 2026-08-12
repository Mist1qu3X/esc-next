import Header from '@/components/Header/Header';
import ErrorPage from '@/components/ErrorPage/ErrorPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
    title: 'Under Maintenance | ESC Shooting',
};

// Страница для технических работ — можно направлять сюда во время обслуживания.
export default function MaintenancePage() {
    return (
        <>
            <Header />
            <main>
                <ErrorPage variant="maintenance" />
            </main>
            <Footer />
        </>
    );
}
