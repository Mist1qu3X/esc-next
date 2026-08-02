import Header from '@/components/Header/Header';
import Info from '@/components/Info/Info';
import FullInfo from '@/components/FullInfo/FullInfo';
import LatestFromEsc from '@/components/LatestFromEsc/LatestFromEsc';
/* import Spotlight from '@/components/Spotlight/Spotlight'; */
import MustSeeAction from '@/components/MustSeeAction/MustSeeAction';
import Ad from '@/components/Ad/Ad';
import FeaturedDocuments from '@/components/FeaturedDocuments/FeaturedDocuments';
import Footer from '@/components/Footer/Footer';
import LoadingGate from '@/components/LoadingResults/LoadingGate';
import HomeSkeleton from '@/components/LoadingResults/HomeSkeleton';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <LoadingGate skeleton={<HomeSkeleton />}>
          <Info />
          <FullInfo />
          <LatestFromEsc />
          {/* <Spotlight /> */}  {/* закомментировано */}
          <MustSeeAction />
          <Ad />
          <FeaturedDocuments />
        </LoadingGate>
      </main>
      <Footer />
    </>
  );
}