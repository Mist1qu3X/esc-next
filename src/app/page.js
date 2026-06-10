import Header from '@/components/Header/Header';
import Info from '@/components/Info/Info';
import FullInfo from '@/components/FullInfo/FullInfo';
import LatestFromEsc from '@/components/LatestFromEsc/LatestFromEsc';
/* import Spotlight from '@/components/Spotlight/Spotlight'; */
import MustSeeAction from '@/components/MustSeeAction/MustSeeAction';
import Ad from '@/components/Ad/Ad';
import FeaturedDocuments from '@/components/FeaturedDocuments/FeaturedDocuments';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Info />
        <FullInfo />
        <LatestFromEsc />
        {/* <Spotlight /> */}  {/* закомментировано */}
        <MustSeeAction />
        <Ad />
        <FeaturedDocuments />
      </main>
      <Footer />
    </>
  );
}