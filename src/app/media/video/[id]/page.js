import Header from '@/components/Header/Header';
import SelectedVideoPage from '@/components/SelectedVideoPage/SelectedVideoPage';
import Footer from '@/components/Footer/Footer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Video | ESC Media`,
  };
}

export default async function VideoPage({ params }) {
  const { id } = await params;
  return (
    <div key={id}>
      <Header />
      <main>
        <SelectedVideoPage id={id} />
      </main>
      <Footer />
    </div>
  );
}
