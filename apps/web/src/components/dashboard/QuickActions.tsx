"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Upload, MapPin, Users, Share2, ArrowRight } from 'lucide-react';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
  bgOpacity: string;
  desc: string;
}

const actions: QuickActionProps[] = [
  { 
    icon: <Upload className="w-6 h-6" />, 
    label: 'Upload Record', 
    href: '/reports', 
    color: 'text-blue-500',
    bgOpacity: 'bg-blue-500/10',
    desc: 'Add new medical docs'
  },
  { 
    icon: <MapPin className="w-6 h-6" />, 
    label: 'Find Services', 
    href: '/maps', 
    color: 'text-emerald-500',
    bgOpacity: 'bg-emerald-500/10',
    desc: 'Locate nearby care'
  },
  { 
    icon: <Users className="w-6 h-6" />, 
    label: 'Family Profile', 
    href: '/family', 
    color: 'text-purple-500',
    bgOpacity: 'bg-purple-500/10',
    desc: 'Manage dependents'
  },
  { 
    icon: <Share2 className="w-6 h-6" />, 
    label: 'Share Access', 
    href: '/settings', 
    color: 'text-orange-500',
    bgOpacity: 'bg-orange-500/10',
    desc: 'Grant doctor access'
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export function QuickActions() {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      {actions.map((action, index) => (
        <Link 
          key={index} 
          href={action.href}
        >
          <motion.div
            variants={item}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all group flex flex-col justify-between h-[160px] relative overflow-hidden"
          >
             {/* Gradient Blob Background */}
             <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity ${action.color.replace('text-', 'bg-')}`} />

            <div className={`size-12 rounded-2xl ${action.bgOpacity} ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              {action.icon}
            </div>
            
            <div className="relative z-10">
              <h4 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{action.label}</h4>
              <p className="text-xs text-text-muted dark:text-gray-400 mt-1">{action.desc}</p>
            </div>
            
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
}
