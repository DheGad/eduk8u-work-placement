import React from 'react';
import { Activity, BarChart3, TrendingUp, Users } from 'lucide-react';

export default function AnalyticsShowcase() {
  const metrics = [
    { icon: Activity, title: 'Global Health Score', desc: 'A single real-time metric indicating the overall operational health of your placement programs.' },
    { icon: ShieldCheck, title: 'Compliance Score', desc: 'Live tracking of required signatures, hour logs, and journal submissions.' },
    { icon: Users, title: 'Placement Pipeline', desc: 'Track students from onboarding, to host matching, to final sign-off in a Kanban-style pipeline.' },
    { icon: TrendingUp, title: 'Risk Trends', desc: 'Predictive analytics to identify cohorts falling behind on hours before they fail.' }
  ];

  return (
    <div className="py-24 bg-slate-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row-reverse gap-16 items-center">
          <div className="w-full lg:w-1/2">
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
              Executive Analytics.<br/>
              <span className="text-indigo-600">Zero Surprises.</span>
            </h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Stop waiting until the end of the term to find out a student hasn't completed their hours. EDUK8U's Executive Analytics provide a real-time pulse on your entire institution.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {metrics.map((m, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <m.icon className="w-6 h-6 text-indigo-600 mb-3" />
                  <h4 className="font-bold text-slate-900 mb-2">{m.title}</h4>
                  <p className="text-sm text-slate-600">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/2">
             <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
               <div className="flex justify-between items-end mb-8">
                  <div>
                     <h3 className="text-slate-900 font-bold text-lg">Risk Trend Analysis</h3>
                     <p className="text-slate-500 text-sm">Actual vs Expected Hours</p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-slate-400" />
               </div>
               
               {/* Abstract Chart UI */}
               <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-slate-300 pb-2 pl-2 relative">
                  {/* Expected Trend Line */}
                  <div className="absolute top-0 bottom-0 left-2 right-0 pointer-events-none">
                     <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M0,100 L20,80 L40,60 L60,40 L80,20 L100,0" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                     </svg>
                  </div>

                  {[40, 55, 60, 75, 80, 95, 100].map((h, i) => (
                     <div key={i} className="w-full bg-indigo-50 rounded-t-sm relative group z-10 border border-indigo-100 border-b-0">
                        <div className="absolute bottom-0 w-full bg-indigo-600 rounded-t-sm transition-all" style={{ height: `${h}%` }}></div>
                     </div>
                  ))}
               </div>
               <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium px-2">
                  <span>Start</span>
                  <span>Mid-Term</span>
                  <span>Completion</span>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
}
