import React from 'react';

interface MarqueeItemProps {
  icon: string;
  text: string;
}

const MarqueeItem: React.FC<MarqueeItemProps> = ({ icon, text }) => (
  <div className="flex items-center gap-3 text-lg font-bold text-text-muted shrink-0">
    <span className="material-symbols-outlined text-primary">{icon}</span> 
    {text}
  </div>
);

export const Marquee: React.FC = () => {
  return (
    <section className="py-20 border-y border-[#e9eff1] dark:border-gray-800 overflow-hidden whitespace-nowrap bg-white dark:bg-background-dark">
      <div className="flex gap-16 animate-marquee items-center px-4 w-max hover:[animation-play-state:paused]">
        {/* Set 1 */}
        <MarqueeItem icon="security" text="HIPAA Compliant" />
        <MarqueeItem icon="verified_user" text="Physician Verified" />
        <MarqueeItem icon="lock" text="End-to-End Encrypted" />
        <MarqueeItem icon="hub" text="Doctor Sharing Enabled" />
        
        {/* Set 2 (Duplicate for loop) */}
        <MarqueeItem icon="security" text="HIPAA Compliant" />
        <MarqueeItem icon="verified_user" text="Physician Verified" />
        <MarqueeItem icon="lock" text="End-to-End Encrypted" />
        <MarqueeItem icon="hub" text="Doctor Sharing Enabled" />

         {/* Set 3 (Extra buffer) */}
        <MarqueeItem icon="security" text="HIPAA Compliant" />
        <MarqueeItem icon="verified_user" text="Physician Verified" />
        <MarqueeItem icon="lock" text="End-to-End Encrypted" />
        <MarqueeItem icon="hub" text="Doctor Sharing Enabled" />
      </div>
    </section>
  );
};

export default Marquee;
