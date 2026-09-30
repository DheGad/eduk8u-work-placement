import React from 'react';

export default function PartnerLogoWall() {
  const partners = [
    'TAFE NSW', 'RMIT University', 'Goodstart Early Learning', 
    'Opal HealthCare', 'St Vincent\'s Health', 'BUPA'
  ];

  return (
    <div className="py-16 bg-slate-50 border-b border-gray-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-bold tracking-widest text-slate-400 uppercase mb-8">
          Trusted by Australia's Leading Training Providers & Employers
        </p>
        
        {/* Simple marquee mockup using flex */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {partners.map((partner, idx) => (
            <div key={idx} className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              {partner}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
