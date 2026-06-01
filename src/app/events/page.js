import Header from '@/components/Header/Header';
import EventsPageContent from '@/components/EventsPageContent/EventsPageContent';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Events Calendar | ESC Shooting',
  description: 'European Shooting Confederation events calendar',
};

export default function EventsPage() {
  return (
    <>
      <Header />
      <main>
        <EventsPageContent />
      </main>
      <Footer />
    </>
  );
}