import Header from '@/components/Header/Header';
import SelectedNewsPage from '@/components/SelectedNewsPage/SelectedNewsPage';
import Footer from '@/components/Footer/Footer';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return {
    title: `${slug} | ESC Media`,
  };
}

export default async function NewsArticle({ params }) {
  const { slug } = await params;
  return (
    <div key={slug}>
      <Header />
      <main>
        <SelectedNewsPage slug={slug} />
      </main>
      <Footer />
    </div>
  );
}