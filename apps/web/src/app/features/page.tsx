import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FeaturesHero } from '@/components/marketing/FeaturesHero';
import { FeatureOne } from '@/components/marketing/FeatureOne';
import { FeatureTwo } from '@/components/marketing/FeatureTwo';
import { FeaturesCarousel } from '@/components/marketing/FeaturesCarousel';
import { CallToAction } from '@/components/marketing/CallToAction';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <FeaturesHero />
        <FeatureOne />
        <FeatureTwo />
        <div className="py-24 bg-gray-50 dark:bg-gray-900/20">
            <div className="text-center mb-16">
                <span className="text-primary font-black uppercase tracking-[0.2em] text-sm mb-4 block">More Tools</span>
                <h2 className="text-4xl lg:text-5xl font-black mb-6 dark:text-white text-text-main">
                    Built for every aspect of care
                </h2>
            </div>
            <FeaturesCarousel />
        </div>
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
