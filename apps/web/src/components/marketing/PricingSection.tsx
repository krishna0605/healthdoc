'use client';

import React from 'react';
import { motion } from 'framer-motion';

const FeatureItem: React.FC<{ feature: string; included: boolean }> = ({ feature, included }) => (
  <div className="flex items-start gap-3 text-sm">
    <div className="mt-1 min-w-[18px]">
      {included ? (
        <span className="material-symbols-outlined text-lg text-primary">check_circle</span>
      ) : (
        <span className="material-symbols-outlined text-red-400 text-lg">close</span>
      )}
    </div>
    <span className={included ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-400 line-through'}>
      {feature}
    </span>
  </div>
);

export const PricingSection: React.FC = () => {
  return (
    <section className="py-32 px-6 lg:px-24">
      <div className="max-w-[1280px] mx-auto text-center">
        <span className="text-primary font-black uppercase tracking-[0.2em] text-sm mb-4 block">Pricing</span>
        <h2 className="text-4xl lg:text-6xl font-black mb-6 leading-tight dark:text-white text-text-main">
          Free Forever
        </h2>
        <p className="text-xl text-text-muted dark:text-gray-400 leading-relaxed mb-12 max-w-2xl mx-auto">
          AI-powered health report analysis at no cost. Secure, private, and always free.
        </p>

        {/* Single Free Plan Card */}
        <div className="max-w-md mx-auto">
          <motion.div
            whileHover={{ y: -10 }}
            className="relative flex flex-col p-8 rounded-4xl border-2 border-primary shadow-2xl shadow-primary/20 bg-white dark:bg-gray-800 transition-all duration-300"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-cyan-400 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
              100% Free
            </div>

            <div className="mb-6 mt-4">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-primary">
                HealthDoc Free
              </h3>
              <div className="flex items-baseline gap-1 justify-center">
                <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  ₹0
                </span>
                <span className="text-gray-400 font-medium">/forever</span>
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                5 report uploads per month. No credit card required.
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/register'}
              className="w-full py-4 rounded-2xl font-bold text-sm mb-8 transition-transform active:scale-95 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              Get Started Free
            </button>

            <div className="flex-1 space-y-4 text-left">
              {[
                'AI-powered health report analysis',
                '5 monthly document uploads',
                'Trend tracking & visualization',
                'Family member profiles',
                'Encrypted health record storage',
                'Shareable secure links',
                'Standard PDF report exports'
              ].map((feature, i) => (
                <FeatureItem key={i} feature={feature} included={true} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span>
            End-to-end encryption
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">security</span>
            HIPAA-style privacy
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">delete_forever</span>
            Delete anytime
          </div>
        </div>
      </div>
    </section>
  );
};
