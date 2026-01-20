import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/marketing/Hero';
import { Marquee } from '@/components/marketing/Marquee';
import { FeatureOne } from '@/components/marketing/FeatureOne';
import { FeatureTwo } from '@/components/marketing/FeatureTwo';
import { FeaturesCarousel } from '@/components/marketing/FeaturesCarousel';
import { CallToAction } from '@/components/marketing/CallToAction';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <FeatureOne />
        <FeatureTwo />
        <FeaturesCarousel />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
