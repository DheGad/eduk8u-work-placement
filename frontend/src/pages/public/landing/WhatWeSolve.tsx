import React, { useState } from 'react';
import { ShieldCheck, Zap, Database, CheckCircle2 } from 'lucide-react';

export default function WhatWeSolve() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { name: 'For RTOs', icon: Zap },
    { name: 'For Compliance', icon: ShieldCheck },
    { name: 'For IT Teams', icon: Database },
  ];

  const content = [
    {
      title: "Eliminate Manual Spreadsheets",
      description: "Replace hundreds of Excel trackers and email threads with a single unified dashboard. Track every student's 120-hour requirement automatically.",
      features: ["Real-time hour tracking", "Automated placement workflows", "At-risk student alerts"]
    },
    {
      title: "Bulletproof ASQA Audits",
      description: "Stop panicking when an audit is announced. EDUK8U maintains an immutable ledger of every signature, document, and approval.",
      features: ["Tripartite digital signatures", "Immutable audit trails", "One-click evidence export"]
    },
    {
      title: "Enterprise Architecture",
      description: "Built for scale, security, and integration. EDUK8U integrates with your existing Student Management Systems (SMS) seamlessly.",
      features: ["PostgreSQL backend", "Strict tenant data isolation", "REST API for custom integrations"]
    }
  ];

  return (
    <div className="py-24 bg-[#0A0A0A] border-b border-[#222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What We Solve</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Education requires precision. We built tools that respect the complexity of your operations.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12 items-center">
          {/* Tabs */}
          <div className="w-full md:w-1/3 flex flex-col gap-2">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                    isActive ? 'bg-[#1A1A1A] border border-[#333] shadow-lg' : 'hover:bg-[#111] border border-transparent'
                  }`}
                >
                  <tab.icon className={`w-6 h-6 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                  <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>{tab.name}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="w-full md:w-2/3">
            <div className="bg-[#111] border border-[#333] rounded-2xl p-8 md:p-12 min-h-[300px]">
              <h3 className="text-2xl font-bold text-white mb-4">{content[activeTab].title}</h3>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                {content[activeTab].description}
              </p>
              <ul className="space-y-4">
                {content[activeTab].features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
