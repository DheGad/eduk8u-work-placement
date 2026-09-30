import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';

export default function BeforeAfterComparison() {
  const comparisons = [
    {
      before: "Students lose physical paper logbooks, requiring hours of manual reconstruction.",
      after: "Digital logbooks with GPS stamping and supervisor portal approvals.",
    },
    {
      before: "Host agreements are sent via email, printed, signed, scanned, and lost.",
      after: "Immutable tripartite digital signatures executed in seconds.",
    },
    {
      before: "Admins spend weeks compiling evidence before an ASQA audit.",
      after: "One-click audit export generates a complete compliance package instantly.",
    },
    {
      before: "At-risk students fall through the cracks until it's too late.",
      after: "Live intelligence dashboards flag lagging students automatically.",
    }
  ];

  return (
    <div className="py-24 bg-slate-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-extrabold text-gray-900 mb-6 tracking-tight">
            The Cost of <span className="text-red-500">Chaos.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Traditional RTOs hemorrhage money and time managing placements. We fix the foundational infrastructure.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Before Column */}
          <div className="flex-1 bg-white border border-red-200 rounded-2xl p-8 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <XCircle className="w-32 h-32 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <span className="text-red-600">Before</span> EDUK8U
            </h3>
            <div className="space-y-6">
              {comparisons.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                  <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-900 text-sm leading-relaxed">{item.before}</p>
                </div>
              ))}
            </div>
          </div>

          {/* VS Divider */}
          <div className="hidden lg:flex items-center justify-center -mx-4 z-10">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 shadow-md flex items-center justify-center text-slate-500 font-black">
              VS
            </div>
          </div>

          {/* After Column */}
          <div className="flex-1 bg-indigo-600 border border-indigo-700 rounded-2xl p-8 relative overflow-hidden shadow-xl text-white">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <CheckCircle2 className="w-32 h-32 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="text-indigo-200">After</span> EDUK8U
            </h3>
            <div className="space-y-6">
              {comparisons.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-indigo-500/50 border border-indigo-400/50">
                  <CheckCircle2 className="w-6 h-6 text-indigo-100 shrink-0 mt-0.5" />
                  <p className="text-indigo-50 text-sm leading-relaxed font-medium">{item.after}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
