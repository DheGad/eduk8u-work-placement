import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Image, Users, UserCheck, GraduationCap, Briefcase, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 'details', title: 'College Details', icon: Building, description: 'Basic RTO information' },
  { id: 'branding', title: 'Branding', icon: Image, description: 'Logos and colors' },
  { id: 'trainers', title: 'Trainers', icon: Users, description: 'Invite your staff' },
  { id: 'supervisors', title: 'Supervisors', icon: UserCheck, description: 'Add host facility supervisors' },
  { id: 'students', title: 'Students', icon: GraduationCap, description: 'Import student roster' },
  { id: 'placement', title: 'First Placement', icon: Briefcase, description: 'Set up your first workflow' },
];

export const OnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-white">
      {/* Header */}
      <header className="h-16 border-b border-[#222222] bg-[#0A0A0A] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold tracking-tighter">E8</span>
          </div>
          <div>
            <h1 className="text-[14px] font-bold tracking-tight">EDUK8U Setup</h1>
            <p className="text-[11px] text-[#71717A]">Pilot College Onboarding</p>
          </div>
        </div>
        <button className="text-[12px] font-medium text-[#A1A1AA] hover:text-white" onClick={() => navigate('/dashboard')}>
          Skip for now
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#222222] bg-[#0A0A0A] p-6 hidden md:block shrink-0">
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#222222] before:to-transparent">
            {STEPS.map((step, idx) => {
              const active = idx === currentStep;
              const completed = idx < currentStep;
              return (
                <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:flex-col md:text-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 bg-[#0A0A0A] transition-colors ${
                    active ? 'border-indigo-500 text-indigo-400' :
                    completed ? 'border-emerald-500 text-emerald-400' :
                    'border-[#333333] text-[#71717A]'
                  }`}>
                    {completed ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
                  </div>
                  <div className="flex-1 md:flex-initial">
                    <h3 className={`text-[13px] font-semibold tracking-tight ${active ? 'text-white' : 'text-[#A1A1AA]'}`}>
                      {step.title}
                    </h3>
                    <p className="text-[11px] text-[#71717A] mt-0.5 max-w-[140px] md:mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Form Content */}
        <main className="flex-1 overflow-y-auto bg-black p-6 sm:p-12 relative">
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Step 1: Details */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">College Details</h2>
                  <p className="text-[13px] text-[#A1A1AA] mt-1">Let's start with the basics of your RTO.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[#A1A1AA]">RTO Name *</label>
                    <input className="h-10 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[14px] text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. International College of Queensland" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-[#A1A1AA]">RTO Code *</label>
                      <input className="h-10 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[14px] text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. 12345" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-[#A1A1AA]">ABN</label>
                      <input className="h-10 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[14px] text-white focus:outline-none focus:border-indigo-500" placeholder="XX XXX XXX XXX" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[#A1A1AA]">Primary Contact Email *</label>
                    <input className="h-10 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[14px] text-white focus:outline-none focus:border-indigo-500" placeholder="admin@college.edu.au" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Branding */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Make it Yours</h2>
                  <p className="text-[13px] text-[#A1A1AA] mt-1">Upload your logo to brand all student and supervisor portals.</p>
                </div>
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-[#333333] rounded-xl p-10 flex flex-col items-center justify-center bg-[#0F0F0F] hover:bg-[#111111] transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Image className="w-6 h-6 text-[#71717A]" />
                    </div>
                    <p className="text-[14px] font-medium text-white">Click to upload logo</p>
                    <p className="text-[12px] text-[#71717A] mt-1">PNG, JPG up to 5MB</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[#A1A1AA]">Brand Color</label>
                    <div className="flex gap-3">
                      {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'].map(c => (
                        <button key={c} className="w-8 h-8 rounded-full border-2 border-transparent focus:border-white focus:outline-none" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Trainers */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Invite Trainers</h2>
                  <p className="text-[13px] text-[#A1A1AA] mt-1">Who will be assessing the students?</p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[#A1A1AA]">Trainer Email Addresses (Comma separated)</label>
                    <textarea className="h-24 p-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[14px] text-white focus:outline-none focus:border-indigo-500 resize-none" placeholder="trainer1@college.edu.au, trainer2@college.edu.au" />
                  </div>
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                    <p className="text-[12px] text-indigo-200 leading-relaxed">
                      We'll send them an email invitation to set their password and access the platform. They'll be automatically assigned the <strong>Trainer</strong> role.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Steps 4,5,6 (Simplified for brevity) */}
            {currentStep > 2 && (
              <div className="space-y-6 text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-[#111111] flex items-center justify-center mx-auto mb-6">
                  {currentStep === 3 ? <UserCheck className="w-8 h-8 text-blue-400" /> : currentStep === 4 ? <GraduationCap className="w-8 h-8 text-emerald-400" /> : <Briefcase className="w-8 h-8 text-purple-400" />}
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {currentStep === 3 ? 'Supervisor Import' : currentStep === 4 ? 'Student Roster' : 'You\'re all set!'}
                </h2>
                <p className="text-[14px] text-[#A1A1AA] max-w-md mx-auto">
                  {currentStep === 5 ? 'We have everything we need to generate your enterprise dashboard. Ready to see the platform in action?' : 'For this demo, we\'ll use sample data or you can import CSVs later in the settings panel.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer / Actions */}
      <footer className="h-20 border-t border-[#222222] bg-[#0A0A0A] flex items-center justify-between px-6 sm:px-12 shrink-0 z-10">
        <button 
          className={`h-10 px-5 rounded-md text-[13px] font-medium flex items-center transition-colors ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white'}`}
          onClick={handleBack}
        >
          <ChevronLeft size={16} className="mr-1.5" /> Back
        </button>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-indigo-500' : 'bg-[#333333]'}`} />
          ))}
        </div>
        <button 
          className="h-10 px-6 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Finalizing...' : currentStep === STEPS.length - 1 ? 'Launch EDUK8U' : 'Continue'} 
          {!isSubmitting && currentStep < STEPS.length - 1 && <ChevronRight size={16} className="ml-1.5" />}
        </button>
      </footer>
    </div>
  );
};

export default OnboardingWizard;
