import Header from '@/components/Header/Header';
import SelectedEventPage from '@/components/SelectedEventPage/SelectedEventPage';
import Footer from '@/components/Footer/Footer';
import config from '@/lib/config';
import { buildMetadata, fetchForMeta } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const e = await fetchForMeta(`${config.API_URL}/api/events?filters[slug][$eq]=${slug}`);
  if (e) {
    return buildMetadata({
      seo: e.seo,
      title: `${e.name} | ESC Events`,
      description: e.description,
      image: e.image,
      path: `/events/${slug}`,
    });
  }
  return { title: `${slug.replace(/-/g, ' ')} | ESC Events` };
}

export default async function EventDetail({ params }) {
  const { slug } = await params;
  return (
    <div key={slug}>
      <Header />
      <main>
        <SelectedEventPage slug={slug} />
      </main>
      <Footer />
    </div>
  );
}