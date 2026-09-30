import React from 'react';
import { MapPin } from 'lucide-react';

export default function GlobalPresenceMap() {
  return (
    <div className="py-24 bg-[#0A0A0A] border-b border-[#222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted Across Australia</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-16">
          From metropolitan Sydney to regional WA, our infrastructure scales to support RTOs nationwide.
        </p>

        <div className="relative max-w-4xl mx-auto h-[400px] bg-[#111] border border-[#222] rounded-3xl overflow-hidden flex items-center justify-center">
          {/* Abstract Map Representation */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at center, #4F46E5 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>
          
          {/* Pins */}
          <div className="absolute top-[30%] right-[30%] flex flex-col items-center">
            <MapPin className="w-8 h-8 text-indigo-500 animate-bounce" />
            <div className="bg-indigo-500/20 px-2 py-1 rounded text-xs text-indigo-300 font-bold mt-2 border border-indigo-500/30 backdrop-blur-sm">
              SYDNEY HQ
            </div>
          </div>

          <div className="absolute top-[45%] right-[35%]">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_#06b6d4]"></div>
          </div>

          <div className="absolute top-[60%] right-[40%]">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_#06b6d4]" style={{ animationDelay: '0.5s' }}></div>
          </div>

          <div className="absolute top-[35%] left-[25%]">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_15px_#a855f7]" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
