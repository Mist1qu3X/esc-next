import Header from '@/components/Header/Header';
import ResultsPage from '@/components/ResultsPage/ResultsPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Results & Rankings | ESC Shooting',
  description: 'ESC competition results, rankings, and records',
};

export default function Results() {
  return (
    <>
      <Header />
      <main>
        <ResultsPage />
      </main>
      <Footer />
    </>
  );
}