import React from 'react';

export const FeatureTwo: React.FC = () => {
  return (
    <section className="py-32 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-primary font-black uppercase tracking-[0.2em] text-sm mb-4 block">Step Two</span>
          <h2 className="text-4xl lg:text-6xl font-black mb-6 dark:text-white text-text-main">
            Demystify the medical jargon.
          </h2>
          <p className="text-xl text-text-muted dark:text-gray-400">
            Our medical-grade AI acts as your personal health advocate, explaining every term in plain English.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Before Card */}
          <div className="bg-background-light dark:bg-gray-800 p-10 rounded-4xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-8">
              <span className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full text-gray-600 dark:text-gray-300">RAW MEDICAL DATA</span>
              <span className="material-symbols-outlined text-gray-400">description</span>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-white dark:bg-[#2d3238] rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm">
                <p className="font-mono text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  &quot;Pt. presents with persistent idiopathic cephalalgia and intermittent paresthesia in distal phalanges. Order MRI to r/o demyelinating pathology.&quot;
                </p>
              </div>
              <div className="flex gap-4 opacity-50">
                <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* After Card */}
          <div className="bg-primary/5 dark:bg-primary/10 p-10 rounded-4xl border-2 border-primary/20 relative shadow-xl shadow-primary/5">
            <div className="absolute -top-4 -right-4 size-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg animate-bounce duration-2000">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div className="flex items-center justify-between mb-8">
              <span className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full">HEALTHDOC TRANSLATION</span>
              <span className="material-symbols-outlined text-primary">chat_bubble</span>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-white dark:bg-[#2d3238] rounded-2xl border border-primary/10 shadow-sm">
                <p className="text-lg font-medium leading-relaxed dark:text-gray-100 text-text-main">
                  &quot;You&apos;ve been having <span className="text-primary font-bold bg-primary/10 px-1 rounded">unexplained headaches</span> and a <span className="text-primary font-bold bg-primary/10 px-1 rounded">tingling feeling</span> in your fingers. The doctor wants a scan to check your nerves.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-primary bg-white dark:bg-[#2d3238] w-fit px-4 py-2 rounded-xl shadow-sm border border-primary/10">
                <span className="material-symbols-outlined text-sm">lightbulb</span> Actionable Insight: Hydration &amp; Posture Check
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureTwo;
