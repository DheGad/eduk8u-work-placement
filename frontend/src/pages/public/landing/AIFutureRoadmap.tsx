import React from 'react';
import { Sparkles, BrainCircuit, Bot } from 'lucide-react';

export default function AIFutureRoadmap() {
  const roadmap = [
    {
      icon: Sparkles,
      title: 'AI Placement Matching',
      desc: 'Predictive algorithms matching students to optimal host employers based on skill matrices and proximity.'
    },
    {
      icon: BrainCircuit,
      title: 'At-Risk Predictive Models',
      desc: 'Machine learning analysis of log-in frequency and hour completion rates to flag students before they drop out.'
    },
    {
      icon: Bot,
      title: 'Automated Logbook Auditing',
      desc: 'Natural language processing to review student journal entries for authenticity and quality.'
    }
  ];

  return (
    <div className="py-24 bg-[#0A0A0A] border-b border-[#222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> The Future is Intelligent
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">AI Roadmap</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              We're not just digitizing forms. We are building an intelligent layer over vocational education to drastically reduce administrative overhead.
            </p>
          </div>
          
          <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {roadmap.map((item, idx) => (
              <div key={idx} className="bg-[#111] border border-[#222] p-6 rounded-2xl hover:border-emerald-500/50 transition-colors">
                <item.icon className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-white font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
