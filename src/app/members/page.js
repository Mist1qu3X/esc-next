import Header from '@/components/Header/Header';
import MembersPage from '@/components/MembersPage/MembersPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Member Federations | ESC Shooting',
  description: 'ESC member federations directory',
};

export default function Members() {
  return (
    <>
      <Header />
      <main>
        <MembersPage />
      </main>
      <Footer />
    </>
  );
}