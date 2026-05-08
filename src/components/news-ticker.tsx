'use client';

import { Zap, Package, ShieldCheck, Store, Star } from 'lucide-react';

const tickerItems = [
  { icon: Zap, text: "Welcome to Defimart - Your trusted campus marketplace!" },
  { icon: Package, text: "Next Pickup: Wednesday & Saturday. Order now and collect on campus!" },
  { icon: ShieldCheck, text: "Pay on Pickup: Simple, secure, and reliable. Inspect before you pay!" },
  { icon: Store, text: "Shop unique items from student-owned stores in the Shops section." },
  { icon: Star, text: "Flash Sales are here! Score amazing deals on study essentials and gadgets." },
];

export function NewsTicker() {
  return (
    <div className="bg-primary/5 border-y border-primary/10 h-10 md:h-12 flex items-center overflow-hidden whitespace-nowrap relative z-30">
      <div className="flex animate-marquee hover:[animation-play-state:paused] gap-12 items-center">
        {/* Render twice for a seamless loop */}
        {[...tickerItems, ...tickerItems].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 px-4">
            <div className="p-1.5 bg-primary/10 rounded-lg">
                <item.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            </div>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[1.5px] text-primary/80 italic font-sans">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}