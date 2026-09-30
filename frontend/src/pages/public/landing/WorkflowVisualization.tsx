import React from 'react';
import { UserCircle, Briefcase, Users, BookOpen, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

export default function WorkflowVisualization() {
  const steps = [
    {
      icon: <UserCircle className="w-8 h-8 text-indigo-100" />,
      label: "Student",
      desc: "Logs hours on mobile device",
      color: "bg-indigo-600",
      delay: "delay-[0ms]"
    },
    {
      icon: <Briefcase className="w-8 h-8 text-slate-100" />,
      label: "Host",
      desc: "Signs tripartite agreement",
      color: "bg-slate-700",
      delay: "delay-[200ms]"
    },
    {
      icon: <Users className="w-8 h-8 text-emerald-100" />,
      label: "Supervisor",
      desc: "Verifies digital logbook",
      color: "bg-emerald-600",
      delay: "delay-[400ms]"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-sky-100" />,
      label: "Trainer",
      desc: "Logs monitoring visits",
      color: "bg-sky-600",
      delay: "delay-[600ms]"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-violet-100" />,
      label: "Compliance Engine",
      desc: "Validates requirements",
      color: "bg-violet-600",
      delay: "delay-[800ms]"
    },
    {
      icon: <FileText className="w-8 h-8 text-rose-100" />,
      label: "Audit Pack",
      desc: "One-click ASQA export",
      color: "bg-rose-600",
      delay: "delay-[1000ms]"
    }
  ];

  return (
    <div className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] font-extrabold text-white mb-6 tracking-tight">
            How EDUK8U Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A seamless, un-siloed data pipeline that automatically compiles your compliance evidence.
          </p>
        </div>

        {/* Desktop Workflow */}
        <div className="hidden lg:flex items-start justify-between relative px-8">
           
           {/* Connecting Line */}
           <div className="absolute top-12 left-16 right-16 h-1 bg-slate-800 rounded-full z-0">
             <div className="h-1 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
           </div>

           {steps.map((step, idx) => (
             <div key={idx} className={`relative z-10 flex flex-col items-center group ${step.delay} animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both`}>
               
               <div className={`w-24 h-24 rounded-2xl ${step.color} flex items-center justify-center shadow-lg transform transition-transform group-hover:-translate-y-2 group-hover:scale-110 mb-6 border-4 border-slate-900`}>
                  {step.icon}
               </div>
               
               <div className="text-center">
                  <h4 className="font-bold text-lg mb-1">{step.label}</h4>
                  <p className="text-sm text-slate-400 max-w-[120px]">{step.desc}</p>
               </div>
             </div>
           ))}
        </div>

        {/* Mobile Workflow */}
        <div className="flex flex-col lg:hidden space-y-4 px-4">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl">
               <div className={`w-16 h-16 rounded-xl ${step.color} shrink-0 flex items-center justify-center`}>
                  {step.icon}
               </div>
               <div>
                  <h4 className="font-bold text-white text-lg">{step.label}</h4>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
               </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
