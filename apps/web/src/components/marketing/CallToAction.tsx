import React from 'react';
import Link from 'next/link';

export const CallToAction: React.FC = () => {
  return (
    <section className="py-24 px-6 bg-background-light dark:bg-background-dark">
      <div className="max-w-[1100px] mx-auto bg-primary rounded-5xl p-12 lg:p-24 text-center relative overflow-hidden group">
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20 transition-transform duration-1000 group-hover:scale-150"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-2xl rounded-full -ml-20 -mb-20 transition-transform duration-1000 group-hover:scale-125"></div>
        
        <div className="relative z-10">
          <h2 className="text-white text-4xl lg:text-6xl font-black mb-8 leading-tight">
            Ready to see your health <br />in high definition?
          </h2>
          <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto font-medium">
            Join thousands of proactive patients who have moved from confusion to clarity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register" className="w-full sm:w-auto bg-white text-primary px-10 py-5 rounded-2xl text-lg font-bold hover:bg-gray-50 transition-colors shadow-xl shadow-black/10">
              Start for Free
            </Link>
            <button className="w-full sm:w-auto bg-primary/20 text-white border border-white/30 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-white/10 transition-colors backdrop-blur-sm">
              See Demo Report
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
