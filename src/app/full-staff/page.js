import Header from '@/components/Header/Header';
import FullStaffPage from '@/components/FullStaffPage/FullStaffPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Full Staff | ESC Shooting',
  description: 'Full staff of the European Shooting Confederation leadership',
  alternates: { canonical: '/full-staff' },
};

export default function FullStaff() {
  return (
    <>
      <Header />
      <main>
        <FullStaffPage />
      </main>
      <Footer />
    </>
  );
}
