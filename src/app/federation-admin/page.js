import Header from '@/components/Header/Header';
import FederationAdmin from '@/components/FederationAdmin/FederationAdmin';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Federation Portal | ESC Shooting',
  description: 'Self-service portal for ESC national federation administrators',
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
