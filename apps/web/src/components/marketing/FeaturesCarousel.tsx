import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="min-w-[300px] lg:min-w-[400px] snap-start bg-white dark:bg-gray-800 p-10 rounded-[2rem] border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
    <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-300">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h3 className="text-2xl font-bold mb-4 dark:text-white text-text-main">{title}</h3>
    <p className="text-text-muted dark:text-gray-400 leading-relaxed text-lg">
      {description}
    </p>
  </div>
);

export const FeaturesCarousel: React.FC = () => {
  return (
    <section className="py-32 px-6 lg:px-24 bg-background-light dark:bg-background-dark">
      <div className="max-w-[1280px] mx-auto">
        <h2 className="text-3xl lg:text-4xl font-black mb-12 dark:text-white text-text-main">
          Intelligent by design.
        </h2>
        
        <div className="flex overflow-x-auto gap-8 pb-12 snap-x snap-mandatory no-scrollbar cursor-grab active:cursor-grabbing">
          <FeatureCard 
            icon="trending_up" 
            title="Trend Analysis" 
            description="We don't just look at one report. We track how your blood work and biomarkers change over years." 
          />
          <FeatureCard 
            icon="share" 
            title="Physician Link" 
            description="Securely share a one-time link with your specialist so they see the full context of your health history." 
          />
          <FeatureCard 
            icon="shield_person" 
            title="Private by Default" 
            description="Your data is never sold to insurers. You own your health records, permanently and fully." 
          />
           <FeatureCard 
            icon="history" 
            title="Historical Context" 
            description="Our AI reads old scanned documents and hand-written notes, digitizing decades of history." 
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesCarousel;
