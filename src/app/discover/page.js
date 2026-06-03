import Header from '@/components/Header/Header';
import DiscoverPage from '@/components/DiscoverPage/DiscoverPage';
import Footer from '@/components/Footer/Footer';
import Ad from '@/components/Ad/Ad';

export default function Discover() {
  return (
    <>
      <Header />
      <main>
        <DiscoverPage />
        <Ad />
      </main>
      <Footer />
    </>
  );
}