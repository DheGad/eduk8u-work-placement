import React from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';

export default function EcosystemShowcase() {
  const products = [
    {
      name: 'EDUK8U Core',
      desc: 'The foundational placement and compliance engine.',
      features: ['Tripartite Signatures', 'Live Hour Tracking', 'ASQA Audit Exporter']
    },
    {
      name: 'ICQA',
      desc: 'Independent Compliance & Quality Assurance.',
      features: ['Third-party Validation', 'Risk Assessments', 'Policy Mapping']
    },
    {
      name: 'WorkReady Asia',
      desc: 'International student placement matching network.',
      features: ['Visa Compliance', 'Offshore Preparation', 'Global Host Network']
    }
  ];

  return (
    <div className="py-24 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold tracking-widest uppercase mb-4 shadow-sm border border-indigo-100">
            <Layers className="w-4 h-4" /> The Ecosystem
          </div>
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            More than software.<br/>
            <span className="text-indigo-600">A global education network.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            EDUK8U is the intelligence layer powering a broader ecosystem of compliance, quality assurance, and international student mobility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((prod, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col">
              <h3 className="text-2xl font-black text-gray-900 mb-3">{prod.name}</h3>
              <p className="text-gray-600 mb-8 flex-1 leading-relaxed">{prod.desc}</p>
              <ul className="space-y-4">
                {prod.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
