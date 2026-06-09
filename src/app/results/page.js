import Header from '@/components/Header/Header';
import ResultsRankingsPage from '@/components/ResultsRankingsPage/ResultsRankingsPage';
import Footer from '@/components/Footer/Footer';

export const metadata = {
  title: 'Results & Rankings | ESC Shooting',
  description: 'ESC competition results, rankings and records',
};

export default function Results() {
  return (
    <>
      <Header />
      <main>
        <ResultsRankingsPage />
      </main>
      <Footer />
    </>
  );
}