import Header from '@/components/Header/Header';
import SelectedNewsPage from '@/components/SelectedNewsPage/SelectedNewsPage';
import Footer from '@/components/Footer/Footer';
import config from '@/lib/config';
import { buildMetadata, fetchForMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  // news-item отдаётся кастомным контроллером как голый массив
  const n = await fetchForMeta(`${config.API_URL}/api/news-items?filters[slug][$eq]=${slug}`, { bareArray: true });
  if (n) {
    return buildMetadata({
      seo: n.seo,
      title: `${n.title} | ESC Media`,
      description: n.description || n.subtitle,
      image: n.image,
      path: `/media/${slug}`,
    });
  }
  return { title: `${slug.replace(/-/g, ' ')} | ESC Media` };
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