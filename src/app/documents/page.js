import Header from '@/components/Header/Header';
import DocumentsPage from '@/components/DocumentsPage/DocumentsPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Documents Library | ESC Shooting',
  description: 'ESC official documents, rules, and publications',
};

export default function Documents() {
  return (
    <>
      <Header />
      <main>
        <DocumentsPage />
      </main>
      <Footer />
    </>
  );
}