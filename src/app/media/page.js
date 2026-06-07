import Header from '@/components/Header/Header';
import MediaPage from '@/components/MediaPage/MediaPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Media & News | ESC Shooting',
  description: 'ESC newsroom, videos, live streams and press releases',
};

export default function Media() {
  return (
    <>
      <Header />
      <main>
        <MediaPage />
      </main>
      <Footer />
    </>
  );
}