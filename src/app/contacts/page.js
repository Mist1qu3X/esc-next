import Header from '@/components/Header/Header';
import ContactsPage from '@/components/ContactsPage/ContactsPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Contacts | ESC Shooting',
  description: 'Get in touch with the European Shooting Confederation team',
};

export default function Contacts() {
  return (
    <>
      <Header />
      <main>
        <ContactsPage />
      </main>
      <Footer />
    </>
  );
}
