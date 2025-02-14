"use client";

import React from 'react';
import Link from 'next/link';

interface QuickActionProps {
  icon: string;
  label: string;
  href: string;
  color: string;
  desc: string;
}

const actions: QuickActionProps[] = [
  { 
    icon: 'upload_file', 
    label: 'Upload Record', 
    href: '/reports', 
    color: 'bg-blue-500',
    desc: 'Add new medical docs'
  },
  { 
    icon: 'location_on', 
    label: 'Find Services', 
    href: '/maps', 
    color: 'bg-emerald-500',
    desc: 'Locate nearby care'
  },
  { 
    icon: 'family_restroom', 
    label: 'Family Profile', 
    href: '/family', 
    color: 'bg-purple-500',
    desc: 'Manage dependents'
  },
  { 
    icon: 'share', 
    label: 'Share Access', 
    href: '/settings', 
    color: 'bg-orange-500',
    desc: 'Grant doctor access'
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {actions.map((action, index) => (
        <Link 
          key={index} 
          href={action.href}
          className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-1 transition-all group flex flex-col justify-between h-[160px]"
        >
          <div className={`size-12 rounded-2xl ${action.color} bg-opacity-10 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            {/* Note: The color prop is just the base color, we need to apply opacity for the bg. 
                However, for simplicity in the map, let's fix the bg class logic below */}
            <span className={`material-symbols-outlined text-2xl ${action.color.replace('bg-', 'text-')}`}>
              {action.icon}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{action.label}</h4>
            <p className="text-xs text-text-muted dark:text-gray-400 mt-1">{action.desc}</p>
          </div>
          
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-gray-300 text-sm">arrow_forward</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
