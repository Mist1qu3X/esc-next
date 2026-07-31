import Header from '@/components/Header/Header';
import PhotoAlbumPage from '@/components/PhotoAlbumPage/PhotoAlbumPage';
import Footer from '@/components/Footer/Footer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, ' ')} | ESC Photo`,
  };
}

export default async function PhotoAlbum({ params }) {
  const { slug } = await params;
  return (
    <div key={slug}>
      <Header />
      <main>
        <PhotoAlbumPage slug={slug} />
      </main>
      <Footer />
    </div>
  );
}
