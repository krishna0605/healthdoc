import React from 'react';

export const FeaturesHero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden bg-gray-50 dark:bg-gray-900/20">
      <div className="max-w-[1280px] mx-auto text-center relative z-10">
        <span className="inline-block py-1 px-3 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 font-bold text-xs uppercase tracking-widest mb-8">
          Powerful Capabilites
        </span>
        <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-tight text-gray-900 dark:text-white">
          Everything you need to <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">
            Master your Health
          </span>
        </h1>
        <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          From AI-powered PDF analysis to instant trend visualization, explore the tools that give you clarity and control.
        </p>
      </div>
    </section>
  );
};
