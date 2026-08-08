import Header from '@/components/Header/Header';
import SelectedNewsPage from '@/components/SelectedNewsPage/SelectedNewsPage';
import Footer from '@/components/Footer/Footer';
import config from '@/lib/config';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const res = await fetch(
      `${config.API_URL}/api/news-items?filters[slug][$eq]=${slug}&populate[image]=true&populate[seo][populate]=*`,
      { next: { revalidate: 3600 } }
    );
    const json = await res.json();
    // news-item отдаётся кастомным контроллером как голый массив
    const n = (Array.isArray(json) ? json : json?.data)?.[0];
    if (n) {
      return buildMetadata({
        seo: n.seo,
        title: `${n.title} | ESC Media`,
        description: n.description || n.subtitle,
        image: n.image,
        path: `/media/${slug}`,
      });
    }
  } catch {
    // API недоступен — вернём безопасный фолбэк ниже
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