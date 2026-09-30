import React from 'react';

export default function SuccessMetrics() {
  const metrics = [
    { value: '1.2M+', label: 'Placement Hours Tracked' },
    { value: '450+', label: 'Host Employers Connected' },
    { value: '100%', label: 'ASQA Audit Success Rate' },
    { value: '2.5x', label: 'Faster Placement Approvals' },
  ];

  return (
    <div className="py-24 bg-[#0A0A0A] border-b border-[#222] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 to-teal-900/10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-[#222]">
          {metrics.map((metric, idx) => (
            <div key={idx} className="text-center px-4">
              <div className="text-4xl md:text-5xl font-extrabold text-emerald-400 mb-2 tracking-tight">
                {metric.value}
              </div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
