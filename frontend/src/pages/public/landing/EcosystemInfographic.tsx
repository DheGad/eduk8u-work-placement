import React from 'react';
import { Network, GraduationCap, Building2, Briefcase, Scale } from 'lucide-react';

export default function EcosystemInfographic() {
  return (
    <div className="py-24 bg-[#0A0A0A] border-b border-[#222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A Unified Ecosystem</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            EDUK8U connects all stakeholders in the vocational education lifecycle, 
            creating a single source of truth for work-integrated learning.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto py-12">
          {/* Connecting Lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#333] to-transparent"></div>
            <div className="absolute h-full w-[2px] bg-gradient-to-b from-transparent via-[#333] to-transparent"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-24 relative z-10">
            {/* College */}
            <div className="bg-[#111] border border-[#333] p-6 rounded-2xl flex flex-col items-center text-center transform -translate-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Training Providers</h3>
              <p className="text-sm text-gray-400">Automate compliance, dispatch placements, and monitor global health scores in real-time.</p>
            </div>

            {/* Employers */}
            <div className="bg-[#111] border border-[#333] p-6 rounded-2xl flex flex-col items-center text-center transform translate-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Host Employers</h3>
              <p className="text-sm text-gray-400">Review student applications, approve hours with one click, and manage facility capacity securely.</p>
            </div>

            {/* Students */}
            <div className="bg-[#111] border border-[#333] p-6 rounded-2xl flex flex-col items-center text-center transform -translate-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Students</h3>
              <p className="text-sm text-gray-400">Log hours from mobile, track skill progression, and upload evidence directly to the vault.</p>
            </div>

            {/* Regulators */}
            <div className="bg-[#111] border border-[#333] p-6 rounded-2xl flex flex-col items-center text-center transform translate-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <Scale className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Regulators (ASQA)</h3>
              <p className="text-sm text-gray-400">Export immutable audit logs, verify digital tripartite agreements, and ensure systemic quality.</p>
            </div>
          </div>
          
          {/* Central Hub Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#0A0A0A] rounded-full border-4 border-[#111] flex items-center justify-center z-20 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
            <Network className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
