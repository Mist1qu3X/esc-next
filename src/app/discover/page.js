import Header from '@/components/Header/Header';
import DiscoverPage from '@/components/DiscoverPage/DiscoverPage';
import Footer from '@/components/Footer/Footer';
import Ad from '@/components/Ad/Ad';
import LoadingGate from '@/components/LoadingResults/LoadingGate';
import AboutSkeleton from '@/components/LoadingResults/AboutSkeleton';

export default function Discover() {
  return (
    <>
      <Header />
      <main>
        <LoadingGate skeleton={<AboutSkeleton />}>
          <DiscoverPage />
          <Ad />
        </LoadingGate>
      </main>
      <Footer />
    </>
  );
}