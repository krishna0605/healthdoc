import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AboutHero } from '@/components/marketing/AboutHero';
import { MissionSection } from '@/components/marketing/MissionSection';
import { CallToAction } from '@/components/marketing/CallToAction';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <AboutHero />
        <MissionSection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
