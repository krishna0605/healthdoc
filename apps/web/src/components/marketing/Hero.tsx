import React from 'react';
import Link from 'next/link';

export const Hero: React.FC = () => {
  return (
    <section className="min-h-screen flex flex-col lg:flex-row pt-20">
      {/* Left: Text Proposition */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-24 py-20 bg-background-light dark:bg-background-dark">
        <div className="max-w-[540px]">
          <h1 className="text-text-main dark:text-white text-5xl lg:text-7xl font-black leading-[1.1] tracking-[-0.04em] mb-8">
            Your health, <br /><span className="text-primary">translated.</span>
          </h1>
          <p className="text-text-muted dark:text-gray-400 text-lg lg:text-xl font-normal leading-relaxed mb-10">
            Stop Googling symptoms. Upload your medical PDFs and let our AI transform complex jargon into actionable, plain-English insights.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/register" 
              className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all flex items-center gap-2"
            >
              Get Your Free Report
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-6 text-sm text-text-muted">
            <div className="flex -space-x-3">
              <div 
                className="size-10 rounded-full border-2 border-white bg-gray-200 bg-cover" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBDQW51ae19c5l3m2ubUH-fi8imwgZhdrYeKhDSCo-UVx0Q_OMZFz7E0W9pdBKJvEJx2eXiwVolUhCOI-Cz4NLnH3wl0TycaxFbeV9sDBLCK1wsafHbwtAW_jo4McPvwulqjJnJj4A4cMTPvZiC3KU7YbTtP7i2PpijwesRp6aqDDJCI0u8MWqOlvxINlrGYQq2wOOMcBsHD8bvSTw5w6x77uuLfWY4wfLvHXMCMeaXx8F3QHmqMHVIQ7xAZyoHsLm56pIwKCvhrHg')" }}
              ></div>
              <div 
                className="size-10 rounded-full border-2 border-white bg-gray-200 bg-cover" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAOfEo0k_BkzKe2zYWfykc1jBCiAq7k9l-LHXAtu-MuCT9DadUfHo_9uf_HwweLcz6yY9DW103DyPIqx60EJ2Nb-h2HsFGvIDl9RF-ZQMqXL8nh8Wirr0Gb68OjbzLTjPXkrynrpd_zSAVc_9UvYXGkJV6LLjc1VvmObPXLwA4LFJb6hB3DuD0bYKEnc2kwYbw5JEberFALw-F-mD1Cst7jBFONUgxZvKah-J2TZ4OCIvxoW8DgFqkiDF7EMrz-SnP2kXo0c7yuMvs')" }}
              ></div>
              <div className="size-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-primary">MD</div>
            </div>
            <p>Trusted by 10,000+ patients &amp; medical professionals.</p>
          </div>
        </div>
      </div>

      {/* Right: Abstract Health Score Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-24 relative overflow-hidden bg-primary/5 dark:bg-primary/10">
        {/* Background Decoration */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full"></div>
        </div>

        {/* Health Score Card */}
        <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#2d3238] p-10 rounded-4xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white dark:border-gray-700">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h3 className="text-xs font-bold text-primary tracking-widest uppercase mb-1">Wellness Index</h3>
              <p className="text-text-muted text-xs">Updated 2m ago</p>
            </div>
            <span className="material-symbols-outlined text-text-muted cursor-pointer hover:text-primary transition-colors">more_horiz</span>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative flex items-center justify-center mb-10">
              {/* Pulsing Circle */}
              <div className="absolute inset-0 rounded-full pulse-soft border border-primary/20"></div>
              <div className="size-48 rounded-full border-10 border-primary/10 flex items-center justify-center relative">
                  {/* SVG for progress ring representation */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/10" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary" strokeDasharray="283" strokeDashoffset="70" strokeLinecap="round" />
                  </svg>
                <div className="flex flex-col items-center z-10">
                  <span className="text-7xl font-black text-text-main dark:text-white">78</span>
                  <span className="text-sm font-bold text-text-muted">/ 100</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-text-main dark:text-white mb-2">Optimal Status</p>
              <p className="text-text-muted dark:text-gray-400 text-sm">Your metabolic markers are trending positively compared to last quarter.</p>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
            <div className="p-4 bg-background-light dark:bg-gray-800 rounded-2xl">
              <p className="text-xs font-bold text-text-muted mb-1">Heart Rate</p>
              <p className="text-lg font-bold dark:text-white">64 BPM</p>
            </div>
            <div className="p-4 bg-background-light dark:bg-gray-800 rounded-2xl">
              <p className="text-xs font-bold text-text-muted mb-1">Insights Found</p>
              <p className="text-lg font-bold dark:text-white">12 New</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
