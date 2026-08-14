import Header from '@/components/Header/Header';
import FederationAdmin from '@/components/FederationAdmin/FederationAdmin';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Кабинет федерации | ESC Shooting',
  description: 'Личный кабинет администратора национальной федерации ESC',
  robots: { index: false, follow: false },
};

export default function FederationAdminPage() {
  return (
    <>
      <Header />
      <main>
        <FederationAdmin />
      </main>
      <Footer />
    </>
  );
}
