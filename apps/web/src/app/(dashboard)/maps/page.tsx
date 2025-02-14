'use client';

import { useState } from 'react';
import { FadeIn } from '@/components/animations/FadeIn';

export default function MapsPage() {
  const [activeTab, setActiveTab] = useState<'doctor' | 'hospital' | 'pharmacy'>('doctor');
  
  return (
    <div className="h-[calc(100vh-8rem)] w-full rounded-3xl overflow-hidden relative bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      
      {/* Search & Toggle Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-4 items-center justify-between pointer-events-none">
        
        {/* Search Bar */}
        <div className="w-full md:w-96 pointer-events-auto shadow-lg rounded-2xl">
           <div className="relative">
             <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
             <input 
               type="text" 
               placeholder="Search location..." 
               className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 rounded-2xl border-none focus:ring-2 focus:ring-primary shadow-sm outline-none font-medium"
             />
           </div>
        </div>

        {/* Toggle Slider */}
        <div className="pointer-events-auto bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-lg flex gap-1">
          {(['doctor', 'hospital', 'pharmacy'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all capitalize flex items-center gap-2 ${
                activeTab === type 
                ? 'bg-primary text-white shadow-md' 
                : 'text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {type === 'doctor' ? 'stethoscope' : type === 'hospital' ? 'local_hospital' : 'medication'}
              </span>
              <span className="hidden md:inline">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-text-muted">
        <div className="text-center">
            <span className="material-symbols-outlined text-6xl opacity-20 mb-4">map</span>
            <p className="font-bold opacity-50">Map Loading...</p>
        </div>
        {/* Actual Map Component will go here */}
      </div>

    </div>
  );
}
