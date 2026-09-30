import React from 'react';

export default function FounderVisionTimeline() {
  const events = [
    { year: '2024', title: 'The Problem Identified', desc: 'Founders recognized the heavy compliance burden RTOs faced during ASQA audits.' },
    { year: '2025', title: 'EDUK8U Core Beta', desc: 'First version of the Intelligence Platform launched, proving the tripartite digital signature model.' },
    { year: '2026', title: 'Pilot Enterprise Launch', desc: 'Onboarding our first wave of premium colleges and integrating automated workflow engines.' },
  ];

  return (
    <div className="py-24 bg-[#0A0A0A] border-b border-[#222]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Our Journey</h2>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#333] before:to-transparent">
          {events.map((event, idx) => (
            <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#444] bg-[#111] text-indigo-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              </div>
              
              {/* Content box */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#222] bg-[#111] shadow-xl">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-white">{event.title}</div>
                  <time className="font-mono text-indigo-400 text-xs">{event.year}</time>
                </div>
                <div className="text-sm text-gray-400">{event.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
