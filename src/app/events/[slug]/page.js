import Header from '@/components/Header/Header';
import SelectedEventPage from '@/components/SelectedEventPage/SelectedEventPage';
import Footer from '@/components/Footer/Footer';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${slug} | ESC Events` };
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