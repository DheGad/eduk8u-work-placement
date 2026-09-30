import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EnterpriseCTA() {
  const navigate = useNavigate();

  return (
    <div className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-indigo-600 border border-indigo-700 p-12 text-center shadow-2xl">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-white/10 blur-[80px] pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10 tracking-tight">
            Ready to upgrade your RTO?
          </h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10 relative z-10">
            Join the pilot program today and transform how your college manages work placements and compliance.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <button 
              onClick={() => navigate('/register')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Request Pilot Access <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              className="bg-indigo-700 border border-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-800 transition-all"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
