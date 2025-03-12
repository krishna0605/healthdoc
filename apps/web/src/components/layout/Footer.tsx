import React from 'react';
import Link from 'next/link';

const SocialIcon: React.FC<{ icon: string; href?: string }> = ({ icon, href }) => {
  const content = (
    <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer text-text-muted">
      <span className="material-symbols-outlined text-sm">{icon}</span>
    </div>
  );
  
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : content;
};

import { Logo } from '@/components/ui/Logo';


export const Footer: React.FC = () => {
  return (
    <footer className="py-20 border-t border-[#e9eff1] dark:border-gray-800 bg-white dark:bg-background-dark">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-24">
        <div className="grid lg:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <Logo className="size-6" />
              <h2 className="text-xl font-black dark:text-white text-text-main">HealthDoc</h2>
            </Link>
            <p className="text-text-muted max-w-sm mb-8 leading-relaxed">
              The intelligent health companion for the modern patient. Translating complexity into longevity.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon="public" href="https://creative-engineer.dev/" />
              <SocialIcon icon="mail" href="mailto:creativesimulation1@gmail.com" />
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 dark:text-white text-text-main">Product</h4>
            <ul className="space-y-4 text-text-muted text-sm">
              <li><Link className="hover:text-primary transition-colors" href="/features">Features</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/about">About</Link></li>
              <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 dark:text-white text-text-main">Legal</h4>
            <ul className="space-y-4 text-text-muted text-sm">
              <li><Link className="hover:text-primary transition-colors" href="/legal/hipaa">HIPAA Policy</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/legal/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/legal/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-[#e9eff1] dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
          <p>© 2024 HealthDoc Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a 
              href="https://creative-engineer.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Designed by Krishna Kapoor
            </a>
            <p>Powered by medical AI.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

