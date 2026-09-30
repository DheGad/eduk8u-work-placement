import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Building2, UserCircle, FileSignature, CheckCircle, Save, ChevronRight, PlayCircle } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

export default function PlacementWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [draftData, setDraftData] = useState<any>({});

  // Fetch active draft
  const { data: drafts } = useQuery({
    queryKey: ['placement-drafts'],
    queryFn: async () => (await apiClient.get('/placements/drafts')).data.drafts
  });

  useEffect(() => {
    if (drafts && drafts.length > 0) {
      setDraftData(drafts[0].data || {});
      setStep(drafts[0].current_step || 1);
    }
  }, [drafts]);

  // Save Draft Mutation
  const saveDraft = useMutation({
    mutationFn: async (data: any) => apiClient.post('/placements/drafts', data),
    onSuccess: () => toast.success('Draft auto-saved')
  });

  // Activate Mutation
  const activatePlacement = useMutation({
    mutationFn: async (draftId: string) => apiClient.post('/placements/drafts/activate', { draft_id: draftId }),
    onSuccess: () => {
      toast.success('Placement Activated Successfully!');
      navigate('/placements');
    }
  });

  const handleNext = () => {
    const nextStep = Math.min(step + 1, 6);
    setStep(nextStep);
    saveDraft.mutate({ data: draftData, current_step: nextStep });
  };

  const steps = [
    { num: 1, title: 'Student', icon: User },
    { num: 2, title: 'Host', icon: Building2 },
    { num: 3, title: 'Supervisor', icon: UserCircle },
    { num: 4, title: 'Agreements', icon: FileSignature },
    { num: 5, title: 'Review', icon: CheckCircle },
    { num: 6, title: 'Activate', icon: PlayCircle }
  ];

  return (
    <div className="page-content max-w-5xl mx-auto">
      <div className="page-header mb-8 pb-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-end">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-indigo-500" />
            Placement Creation Wizard
          </h1>
          <p className="text-slate-500 mt-2">Draft, review, and activate a new student placement.</p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2" onClick={() => saveDraft.mutate({ data: draftData, current_step: step })}>
          <Save className="w-4 h-4" /> Save Draft
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Stepper */}
        <div className="w-64 shrink-0 hidden md:block">
          <ul className="space-y-4 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {steps.map(s => {
              const isActive = s.num === step;
              const isPast = s.num < step;
              return (
                <li key={s.num} className="relative flex items-center gap-4 cursor-pointer" onClick={() => setStep(s.num)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 z-10 transition-colors ${
                    isActive ? 'bg-indigo-600 border-indigo-200 text-white' : 
                    isPast ? 'bg-emerald-500 border-emerald-200 text-white' : 
                    'bg-slate-100 border-white text-slate-400 dark:bg-slate-800 dark:border-slate-900'
                  }`}>
                    {isPast ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <span className={`font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : isPast ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                    {s.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Content Area */}
        <div className="flex-1 card p-8 min-h-[500px] flex flex-col">
          {step === 1 && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold mb-4">Step 1: Select Student</h2>
              <p className="text-slate-500 mb-6">Choose an enrolled student who is ready for placement.</p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Search Student</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Enter student ID or name..." 
                  value={draftData.studentName || ''}
                  onChange={e => setDraftData({...draftData, studentName: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold mb-4">Step 2: Assign Host Facility</h2>
              <p className="text-slate-500 mb-6">Select an approved facility with available capacity.</p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Facility Name</label>
                <select className="input" value={draftData.facility || ''} onChange={e => setDraftData({...draftData, facility: e.target.value})}>
                  <option value="">-- Select Facility --</option>
                  <option value="bluecare">BlueCare Respite Centre (4 slots available)</option>
                  <option value="opal">Opal Aged Care (2 slots available)</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold mb-4">Step 3: Assign Supervisor</h2>
              <p className="text-slate-500 mb-6">Designate the clinical supervisor responsible for signing off hours.</p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Supervisor Name</label>
                <input type="text" className="input" placeholder="e.g. John Doe" value={draftData.supervisor || ''} onChange={e => setDraftData({...draftData, supervisor: e.target.value})} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold mb-4">Step 4: Generate Agreements</h2>
              <p className="text-slate-500 mb-6">Prepare the Tripartite Agreement (CA0393) for digital signature.</p>
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
                <FileSignature className="w-8 h-8 mb-2 text-blue-500" />
                <p className="font-medium">The system will automatically dispatch the agreement to the Student and Host Manager upon activation.</p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold mb-4">Step 5: Final Review</h2>
              <p className="text-slate-500 mb-6">Review the draft configuration before finalizing.</p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">
                  {JSON.stringify(draftData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in fade-in text-center flex flex-col items-center justify-center h-full my-auto">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <PlayCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Ready to Activate</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-8">
                Activating this placement will trigger notifications to the student and supervisor, and lock the workflow.
              </p>
              <button 
                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg px-8 py-3 text-lg"
                onClick={() => drafts && drafts[0] && activatePlacement.mutate(drafts[0].id)}
                disabled={activatePlacement.isPending}
              >
                {activatePlacement.isPending ? 'Activating...' : 'Activate Placement Now'}
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < 6 && (
            <div className="mt-auto pt-8 flex justify-end border-t border-slate-100 dark:border-slate-700">
              <button className="btn btn-primary flex items-center gap-2" onClick={handleNext}>
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
