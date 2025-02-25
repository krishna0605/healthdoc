import React from 'react';

export const AboutHero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-[pulse_4s_infinite]" />

      <div className="max-w-[1280px] mx-auto text-center relative z-10">
        <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-8">
          Our Story
        </span>
        <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-tight text-gray-900 dark:text-white">
          Democratizing <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
            Health Intelligence
          </span>
        </h1>
        <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          We believe everyone deserves effortless access to their own medical history, translated from complex jargon into clear, actionable insights.
        </p>
      </div>
    </section>
  );
};
