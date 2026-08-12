'use client';
// Границы ошибок должны быть клиентскими компонентами (App Router).
import { useEffect } from 'react';
import Header from '@/components/Header/Header';
import ErrorPage from '@/components/ErrorPage/ErrorPage';
import Footer from '@/components/Footer/Footer';

export default function Error({ error, unstable_retry, reset }) {
    useEffect(() => {
        // Логируем ошибку (в проде — в консоль/мониторинг)
        console.error(error);
    }, [error]);

    return (
        <>
            <Header />
            <main>
                <ErrorPage variant="500" reset={unstable_retry || reset} />
            </main>
            <Footer />
        </>
    );
}
