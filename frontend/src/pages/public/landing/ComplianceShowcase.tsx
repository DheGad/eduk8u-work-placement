import React from 'react';
import { Shield, Fingerprint, FileWarning, CheckCircle, Search, FileText } from 'lucide-react';

export default function ComplianceShowcase() {
  const features = [
    { icon: Fingerprint, title: 'Compliance Risk Engine', desc: 'Dynamically calculates an Audit Readiness Score for every cohort in real-time.' },
    { icon: Search, title: 'Missing Evidence Detection', desc: 'Automatically flags missing signatures, unlogged hours, and overdue journals before they become violations.' },
    { icon: CheckCircle, title: 'Monitoring Visit Tracking', desc: 'Ensure trainers are visiting hosts with automated scheduling and digital sign-offs.' },
    { icon: FileText, title: 'One-Click Audit Pack', desc: 'Instantly generate a complete ASQA-compliant PDF dossier containing every required artifact.' }
  ];

  return (
    <div className="py-24 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold mb-6 uppercase tracking-widest">
              <Shield className="w-4 h-4" /> Compliance Intelligence
            </div>
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
              Audit Readiness,<br/>
              <span className="text-indigo-600">Quantified.</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              We built EDUK8U to survive the most rigorous regulatory scrutiny. Our Intelligence Engine acts as an automated auditor, constantly scanning your data for gaps.
            </p>
            
            <div className="space-y-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-bold text-lg mb-1">{feature.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Abstract UI Side */}
          <div className="w-full lg:w-1/2">
            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-slate-800">
              
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                 <div>
                    <div className="text-white font-bold text-xl">Compliance Heatmap</div>
                    <div className="text-slate-400 text-sm">Identifying campus-level risk</div>
                 </div>
                 <div className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 font-bold">99% AUDIT READY</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                   { name: 'Brisbane Campus', score: '99%', status: 'optimal' },
                   { name: 'Sydney Campus', score: '95%', status: 'optimal' },
                   { name: 'Melbourne Campus', score: '82%', status: 'warning' },
                   { name: 'Online Cohort', score: '98%', status: 'optimal' },
                 ].map((campus, idx) => (
                   <div key={idx} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                     <div className="text-slate-300 font-bold text-sm mb-2">{campus.name}</div>
                     <div className="flex items-end justify-between">
                       <div className={`text-3xl font-black ${campus.status === 'optimal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                         {campus.score}
                       </div>
                       {campus.status === 'warning' && <FileWarning className="w-5 h-5 text-amber-400 mb-1" />}
                     </div>
                   </div>
                 ))}
              </div>

              <div className="mt-8 bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-5 backdrop-blur-sm">
                 <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-indigo-100 font-bold">Generate Audit Pack</h4>
                      <p className="text-indigo-300 text-xs mt-1">Compile evidence for 1,248 students</p>
                    </div>
                    <button className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md transition-colors">
                      Execute PDF Build
                    </button>
                 </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
