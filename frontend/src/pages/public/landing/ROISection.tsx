import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, TrendingUp } from 'lucide-react';

export default function ROISection() {
  return (
    <div className="py-24 bg-indigo-900 relative overflow-hidden text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] font-extrabold text-white mb-6 tracking-tight">
            Tangible Return on Investment
          </h2>
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
            EDUK8U isn't just software; it's a financial lever. By automating compliance, colleges save thousands of administrative hours per year.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-indigo-800/50 backdrop-blur-sm border border-indigo-700 p-8 rounded-3xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/50">
              <Clock className="w-8 h-8 text-indigo-100" />
            </div>
            <div className="text-5xl font-black text-white mb-2 tracking-tighter">
              <Counter end={500} suffix="+" />
            </div>
            <h3 className="text-lg font-bold text-indigo-200 mb-2">Hours Saved</h3>
            <p className="text-indigo-300 text-sm">Per cohort, eliminating manual data entry and email chasing.</p>
          </div>

          <div className="bg-indigo-800/50 backdrop-blur-sm border border-indigo-700 p-8 rounded-3xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/50">
              <ShieldCheck className="w-8 h-8 text-indigo-100" />
            </div>
            <div className="text-5xl font-black text-white mb-2 tracking-tighter">
              <Counter end={90} suffix="%" />
            </div>
            <h3 className="text-lg font-bold text-indigo-200 mb-2">Audit Prep Reduction</h3>
            <p className="text-indigo-300 text-sm">Decrease the time spent preparing for ASQA monitoring visits.</p>
          </div>

          <div className="bg-indigo-800/50 backdrop-blur-sm border border-indigo-700 p-8 rounded-3xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/50">
              <TrendingUp className="w-8 h-8 text-indigo-100" />
            </div>
            <div className="text-5xl font-black text-white mb-2 tracking-tighter">
              <Counter end={100} suffix="%" />
            </div>
            <h3 className="text-lg font-bold text-indigo-200 mb-2">Compliance Visibility</h3>
            <p className="text-indigo-300 text-sm">Real-time tracking of every required signature, hour, and journal.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

// Simple Animated Counter
function Counter({ end, suffix = '' }: { end: number, suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000; // 2 seconds
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end]);

  return <>{count}{suffix}</>;
}
