import React from 'react';
import { Database, Wand2, Rocket } from 'lucide-react';

export default function CustomerOnboardingJourney() {
  const steps = [
    {
      icon: Database,
      title: 'Data Migration',
      desc: 'Our engineering team securely imports your existing student and host databases from any legacy SMS (VETtrak, Wisenet, JobReady).'
    },
    {
      icon: Wand2,
      title: 'Workflow Configuration',
      desc: 'We map your specific course requirements, compliance documents, and signature workflows into our Rules Engine.'
    },
    {
      icon: Rocket,
      title: 'Pilot Go-Live',
      desc: 'Launch to a select cohort of students. Our Customer Success team monitors latency and compliance in real-time alongside you.'
    }
  ];

  return (
    <div className="py-24 bg-slate-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-extrabold text-gray-900 mb-6 tracking-tight">
            Seamless <span className="text-indigo-600">Migration.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Switching enterprise software shouldn't be a nightmare. We handle the heavy lifting so your IT team doesn't have to.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-indigo-300 hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <step.icon className="w-32 h-32 text-indigo-600" />
              </div>
              
              <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 text-indigo-600 font-black text-2xl shadow-sm">
                0{idx + 1}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed relative z-10">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
