import React from 'react';
import Link from 'next/link';

const SocialIcon: React.FC<{ icon: string }> = ({ icon }) => (
  <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer text-text-muted">
    <span className="material-symbols-outlined text-sm">{icon}</span>
  </div>
);

// HealthDoc Logo SVG
const Logo = () => (
  <div className="size-6 text-primary">
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
    </svg>
  </div>
);

export const Footer: React.FC = () => {
  return (
    <footer className="py-20 border-t border-[#e9eff1] dark:border-gray-800 bg-white dark:bg-background-dark">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-24">
        <div className="grid lg:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <Logo />
              <h2 className="text-xl font-black dark:text-white text-text-main">HealthDoc</h2>
            </Link>
            <p className="text-text-muted max-w-sm mb-8 leading-relaxed">
              The intelligent health companion for the modern patient. Translating complexity into longevity.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon="public" />
              <SocialIcon icon="mail" />
              <SocialIcon icon="smart_display" />
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 dark:text-white text-text-main">Product</h4>
            <ul className="space-y-4 text-text-muted text-sm">
              <li><a className="hover:text-primary transition-colors" href="#">Features</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Pricing</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Success Stories</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 dark:text-white text-text-main">Legal</h4>
            <ul className="space-y-4 text-text-muted text-sm">
              <li><a className="hover:text-primary transition-colors" href="#">HIPAA Policy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-[#e9eff1] dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
          <p>© 2024 HealthDoc Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <p>Designed for clarity.</p>
            <p>Powered by medical AI.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
