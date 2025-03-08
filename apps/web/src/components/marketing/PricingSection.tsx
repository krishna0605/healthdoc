'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PricingCard: React.FC<{
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPro?: boolean;
  buttonText: string;
  onClick?: () => void;
}> = ({ title, price, period, description, features, isPro = false, buttonText, onClick }) => (
  <motion.div
    whileHover={{ y: -10 }}
    className={`relative flex flex-col p-8 rounded-4xl border ${
      isPro 
        ? 'border-primary shadow-2xl shadow-primary/20 bg-white dark:bg-gray-800 scale-105 z-10' 
        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 shadow-xl'
    } transition-all duration-300 h-full`}
  >
    {isPro && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-cyan-400 text-white font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
        Most Popular
      </div>
    )}

    <div className="mb-6">
      <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isPro ? 'text-primary' : 'text-gray-400'}`}>
        {title}
      </h3>
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
          {price}
        </span>
        <span className="text-gray-400 font-medium">/{period}</span>
      </div>
      <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>

    <button
      onClick={onClick}
      className={`w-full py-4 rounded-2xl font-bold text-sm mb-8 transition-transform active:scale-95 ${
        isPro
          ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {buttonText}
    </button>

    <div className="flex-1 space-y-4">
      {features.map((feature, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <div className="mt-1 min-w-[18px]">
             {feature.startsWith('no-') ? (
                 <span className="material-symbols-outlined text-red-400 text-lg">close</span>
             ) : (
                <span className={`material-symbols-outlined text-lg ${isPro ? 'text-primary' : 'text-primary/70'}`}>check_circle</span>
             )}
          </div>
          <span className={`${feature.startsWith('no-') ? 'text-gray-400 line-through' : 'text-gray-600 dark:text-gray-300 font-medium'}`}>
             {feature.replace('no-', '')}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

export const PricingSection: React.FC = () => {
    const [isAnnual, setIsAnnual] = useState(true);
    const [loading, setLoading] = useState<string | null>(null);
    // Note: In a marketing component, we might not have direct access to auth context 
    // unless wrapped in the provider. Assuming it is, or we use a simple check.
    // Ideally, we redirect to register if not logged in.
    
    // We'll use a direct window location check or standard fetch for now
    // But since this is a client component, we can try to import useAuth if available
    // or just redirect to the app portal for upgrade.
    
    const handleUpgrade = async (plan: string) => {
        setLoading(plan);
        const planTier = plan === 'Pro' ? 'PRO' : 'FAMILY';
        
        // 1. Check if user is logged in (simplified check for public page)
        // If we can't easily check auth here without context, strictly redirecting 
        // to the dashboard billing page is a safer UX pattern for a marketing site.
        // However, to fulfill the "Click -> Pay" requirement:
        
        try {
             // Attempt to call API directly - if 401, redirect to login
             // We need the user ID. If we are on the marketing site, we might not have the session.
             // Strategy: Redirect to the dashboard billing page with a query param to auto-trigger?
             // Or better: Redirect to Register/Login with a 'redirect_to' param?
             
             // Simplest robust path for "Get Pro Today" on a public site:
             // Redirect user to the dashboard billing page where logic already exists.
             window.location.href = `/settings/billing?plan=${planTier}`;
             
        } catch (error) {
            console.error(error);
            alert('Please log in to upgrade.');
            window.location.href = '/login';
        } finally {
            setLoading(null);
        }
    };

    const plans = [
        {
          title: "Basic",
          price: "₹0",
          description: "Essential for started your health tracking.",
          buttonText: "Get Started Free",
          onClick: () => window.location.href = '/register',
          features: [
            "10 monthly document uploads",
            "Encrypted health record storage",
            "Standard PDF report exports",
            "no-RAG AI Chat assistant"
          ]
        },
        {
          title: "Pro",
          price: isAnnual ? "₹1,599" : "₹1,999",
          description: "Advanced AI tools for peak performance.",
          isPro: true,
          buttonText: loading === 'Pro' ? "Processing..." : "Get Pro Today",
          onClick: () => handleUpgrade('Pro'),
          features: [
            "Unlimited report generation",
            "Advanced health trend analysis",
            "RAG AI Chat assistant (24/7)",
            "Priority AI processing speed",
            "Early access to new features"
          ]
        },
         {
          title: "Family",
          price: isAnnual ? "₹3,999" : "₹4,999",
          description: "Comprehensive care for your whole household.",
          buttonText: loading === 'Family' ? "Processing..." : "Select Family Plan",
          onClick: () => handleUpgrade('Family'),
          features: [
            "Up to 5 individual profiles",
            "Centralized family dashboard",
            "Enhanced doctor-sharing portal",
            "VIP support & AI processing",
            "Unified billing for all members"
          ]
        }
    ];

  return (
    <section className="py-32 px-6 lg:px-24">
      <div className="max-w-[1280px] mx-auto text-center">
        <span className="text-primary font-black uppercase tracking-[0.2em] text-sm mb-4 block">Pricing</span>
        <h2 className="text-4xl lg:text-6xl font-black mb-6 leading-tight dark:text-white text-text-main">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-text-muted dark:text-gray-400 leading-relaxed mb-12 max-w-2xl mx-auto">
           Choose the plan that fits your health journey. Secure, AI-powered insights for you and your family.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
            <button 
                onClick={() => setIsAnnual(false)}
                className={`text-sm font-bold transition-colors ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
            >
                Monthly
            </button>
            <div 
                className="w-16 h-8 bg-gray-100 dark:bg-gray-800 rounded-full p-1 cursor-pointer relative"
                onClick={() => setIsAnnual(!isAnnual)}
            >
                <motion.div 
                    className="w-6 h-6 bg-white dark:bg-gray-600 rounded-full shadow-sm"
                    animate={{ x: isAnnual ? 32 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
            <button 
                 onClick={() => setIsAnnual(true)}
                 className={`text-sm font-bold transition-colors flex items-center gap-2 ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
            >
                Annual <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
            </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
            {plans.map((plan, i) => (
                <PricingCard 
                    key={i}
                    {...plan}
                    period="mo"
                />
            ))}
        </div>
      </div>
    </section>
  );
};
