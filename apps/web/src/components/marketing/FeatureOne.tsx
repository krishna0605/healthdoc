import React from 'react';

const FeatureCheckItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center gap-3 font-bold dark:text-white text-text-main">
    <span className="material-symbols-outlined text-primary fill-1">check_circle</span>
    {text}
  </div>
);

export const FeatureOne: React.FC = () => {
  return (
    <section className="py-32 px-6 lg:px-24 max-w-[1280px] mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-20">
        <div className="flex-1 order-2 lg:order-1 w-full">
          <div className="h-[500px] w-full bg-primary/10 rounded-5xl overflow-hidden flex items-center justify-center p-12 relative group">
             {/* Decorative blob behind */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-3xl rounded-full"></div>

            <div className="w-full h-full bg-white dark:bg-[#2d3238] rounded-3xl shadow-xl p-8 border border-white dark:border-gray-700 flex flex-col items-center justify-center text-center relative z-10 transition-transform duration-500 group-hover:scale-[1.02]">
              <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-4xl">upload_file</span>
              </div>
              <h4 className="text-2xl font-bold mb-4 dark:text-white">Drag & Drop Documents</h4>
              <p className="text-text-muted dark:text-gray-400">PDFs, lab results, or imaging reports.</p>
              
              <div className="mt-8 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-primary rounded-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 order-1 lg:order-2">
          <span className="text-primary font-black uppercase tracking-[0.2em] text-sm mb-4 block">Step One</span>
          <h2 className="text-4xl lg:text-6xl font-black mb-8 leading-tight dark:text-white text-text-main">
            Consolidate your history in seconds.
          </h2>
          <p className="text-xl text-text-muted dark:text-gray-400 leading-relaxed mb-10">
            Your records are currently scattered across patient portals. HealthDoc pulls them into one secure vault, creating a unified timeline of your health journey.
          </p>
          <div className="space-y-4">
            <FeatureCheckItem text="Supports all major US hospitals" />
            <FeatureCheckItem text="Direct EHR integration" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureOne;
