import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PricingSection } from '@/components/marketing/PricingSection';
import { FAQSection } from '@/components/marketing/FAQSection';
import { CallToAction } from '@/components/marketing/CallToAction';

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <PricingSection />
        <FAQSection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
