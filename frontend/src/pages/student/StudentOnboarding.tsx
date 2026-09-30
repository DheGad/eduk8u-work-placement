import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, UserCircle, FileText, ShieldCheck, FileSignature, Rocket } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const steps = [
    { num: 1, title: 'Profile', icon: UserCircle, desc: 'Confirm your personal details' },
    { num: 2, title: 'Documents', icon: FileText, desc: 'Upload Police Check & WWCC' },
    { num: 3, title: 'Readiness', icon: ShieldCheck, desc: 'Review placement rules' },
    { num: 4, title: 'Agreement', icon: FileSignature, desc: 'Sign Tripartite Agreement' },
    { num: 5, title: 'Start', icon: Rocket, desc: 'Begin your placement' },
  ];

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiClient.post('/students/complete-onboarding');
      toast.success('Onboarding complete! Welcome to your placement.');
      navigate('/portal/student');
    } catch (err: any) {
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to EDUK8U</h1>
          <p className="text-slate-600 dark:text-slate-400">Let's get you set up for your clinical placement.</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between items-center mb-12 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 -z-10 -translate-y-1/2 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((s) => {
            const isCompleted = s.num < step;
            const isCurrent = s.num === step;
            return (
              <div key={s.num} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-4 transition-colors ${
                  isCompleted ? 'bg-indigo-500 border-indigo-200 text-white' : 
                  isCurrent ? 'bg-white border-indigo-500 text-indigo-600 dark:bg-slate-800' : 
                  'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                </div>
                <div className="text-center mt-3 hidden sm:block">
                  <div className={`text-sm font-bold ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>{s.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="card p-8 min-h-[400px] flex flex-col relative overflow-hidden">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-4">Confirm Your Profile</h2>
              <p className="text-slate-600 mb-6">Before starting, please ensure your details are correct. These will be used for your legal placement documents.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input type="text" className="input" defaultValue="Sarah" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input type="text" className="input" defaultValue="Connor" disabled />
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-4">Mandatory Compliance Documents</h2>
              <p className="text-slate-600 mb-6">You must provide evidence of a clean Police Check and Working With Children Check (WWCC).</p>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center text-slate-500 mb-4 bg-slate-50">
                Drag and drop your PDF certificates here (Simulated)
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-4">Placement Readiness Rules</h2>
              <p className="text-slate-600 mb-6">Please read and acknowledge the following rules regarding your placement conduct.</p>
              <ul className="space-y-4 mb-4">
                <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600" checked readOnly />
                  <span className="text-sm font-medium text-slate-700">I agree to maintain professional confidentiality at all times.</span>
                </li>
                <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg">
                  <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600" checked readOnly />
                  <span className="text-sm font-medium text-slate-700">I will log my attendance hours daily and accurately.</span>
                </li>
              </ul>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold mb-4">Tripartite Agreement</h2>
              <p className="text-slate-600 mb-6">Sign the legal agreement between yourself, the College, and the Host Facility.</p>
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg text-center mb-4">
                <FileSignature className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <button className="btn btn-primary px-8">Sign Agreement Electronically</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Rocket className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold mb-4">You're All Set!</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-8">
                Your profile is complete, documents are verified, and your agreement is signed. You are now ready to begin logging hours.
              </p>
            </div>
          )}

          <div className="mt-auto pt-8 flex justify-between items-center border-t border-slate-100 dark:border-slate-700">
            <button 
              className={`btn ${step === 1 ? 'invisible' : 'btn-secondary'}`}
              onClick={() => setStep(s => Math.max(1, s - 1))}
            >
              Back
            </button>
            
            {step < steps.length ? (
              <button className="btn btn-primary flex items-center gap-2" onClick={() => setStep(s => Math.min(steps.length, s + 1))}>
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-500/30" onClick={handleComplete} disabled={loading}>
                {loading ? 'Processing...' : 'Complete & Go to Dashboard'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
