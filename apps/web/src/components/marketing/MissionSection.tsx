import React from 'react';

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg text-center">
    <div className="text-4xl font-black text-primary mb-2">{value}</div>
    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</div>
  </div>
);

export const MissionSection: React.FC = () => {
  return (
    <section className="py-24 px-6 lg:px-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-center mb-24">
           {/* Text Content */}
           <div className="flex-1">
             <h2 className="text-3xl lg:text-5xl font-black mb-8 text-gray-900 dark:text-white leading-tight">
               Built for patients, <br/>
               <span className="text-gray-400">trusted by families.</span>
             </h2>
             <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
               <p>
                 Healthcare data is often trapped in silos—paper records, incompatible portals, and confusing formats. This fragmentation puts patients at a disadvantage when making critical health decisions.
               </p>
               <p>
                 HealthDoc started with a simple mission: <strong>Use AI to bridge the gap between medical data and human understanding.</strong> By parsing complex PDFs and standardizing health metrics, we give you the full picture of your well-being.
               </p>
             </div>
           </div>

           {/* Stats / Visual */}
           <div className="flex-1 w-full">
             <div className="grid grid-cols-2 gap-6">
                <StatCard value="99.9%" label="Uptime" />
                <StatCard value="256-bit" label="Encryption" />
                <StatCard value="10k+" label="Reports Analyzed" />
                <StatCard value="24/7" label="AI Availability" />
             </div>
           </div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { icon: 'shield_lock', title: 'Privacy First', desc: 'Your data is yours. We use bank-level encryption and never sell your personal health information.' },
                { icon: 'science', title: 'Clinical Accuracy', desc: 'Our AI models are tuned on medical datasets to ensure precise extraction and context.' },
                { icon: 'accessibility_new', title: 'Universal Access', desc: 'Health looks different for everyone. Our platform is built to be accessible and intuitive for all ages.' }
            ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-colors duration-300">
                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                        <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};
