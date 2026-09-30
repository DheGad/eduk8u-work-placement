import React, { useState } from 'react';
import { LayoutDashboard, Users, BookOpen, UserCircle, Briefcase, Lock, Clock, FileCheck, CheckCircle } from 'lucide-react';

export default function LiveDemoCenter() {
  const [activeTab, setActiveTab] = useState('admin');

  const tabs = [
    { id: 'admin', label: 'College Admin', icon: LayoutDashboard },
    { id: 'student', label: 'Student Portal', icon: UserCircle },
    { id: 'trainer', label: 'Trainer Portal', icon: BookOpen },
    { id: 'supervisor', label: 'Supervisor App', icon: Users },
    { id: 'host', label: 'Host Manager', icon: Briefcase },
  ];

  return (
    <div className="py-32 bg-slate-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-extrabold text-slate-900 mb-6 tracking-tight">
            One Core Platform. <span className="text-indigo-600">Five Tailored UIs.</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Toggle below to experience EDUK8U from the perspective of each stakeholder. Every role gets exactly the tools they need to eliminate compliance friction.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 bg-white p-2 rounded-2xl border border-slate-200 max-w-4xl mx-auto shadow-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm'
                    : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Realistic Browser Window Mockup */}
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-900/10 overflow-hidden ring-1 ring-slate-900/5">
            
            {/* Browser Header */}
            <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              </div>
              <div className="mx-auto bg-white border border-slate-200 rounded-md px-4 py-1.5 text-xs text-slate-500 font-mono w-72 text-center shadow-sm flex items-center justify-center gap-2">
                <Lock size={12} className="text-emerald-500"/> app.eduk8u.com/{activeTab}
              </div>
            </div>

            {/* Browser Content - Dynamic based on activeTab */}
            <div className="p-0 sm:p-8 min-h-[600px] bg-slate-50 transition-opacity duration-500 flex items-center justify-center">
              
              {activeTab === 'admin' && <AdminMock />}
              {activeTab === 'student' && <StudentMock />}
              {activeTab === 'trainer' && <TrainerMock />}
              {activeTab === 'supervisor' && <SupervisorMock />}
              {activeTab === 'host' && <HostMock />}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Mocks ─────────────────────────────────────────────────────────────

function AdminMock() {
  return (
    <div className="w-full animate-in fade-in duration-500 bg-white border border-slate-200 rounded-xl shadow-sm p-6 h-full">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Executive Dashboard</h3>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of compliance risk across all cohorts.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm">Download ASQA Audit Pack</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
         <MetricBox title="Global Health" value="92%" subtitle="Across 1,248 placements" color="indigo" />
         <MetricBox title="Compliance Score" value="88%" subtitle="Required signatures" color="emerald" />
         <MetricBox title="At-Risk Students" value="14" subtitle="Falling behind hours" color="amber" invert />
         <MetricBox title="Audit Readiness" value="99%" subtitle="Zero missing journals" color="indigo" />
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
         <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                  <th className="px-6 py-3 font-semibold text-slate-600">Student Name</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Host Facility</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Progress</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               <tr>
                  <td className="px-6 py-4 font-bold text-indigo-600">Sarah Jenkins</td>
                  <td className="px-6 py-4 text-slate-600">Blue Care (Springwood)</td>
                  <td className="px-6 py-4">
                     <ProgressBar current={96} max={120} color="indigo" />
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">On Track</span></td>
               </tr>
               <tr>
                  <td className="px-6 py-4 font-bold text-indigo-600">Liam Smith</td>
                  <td className="px-6 py-4 text-slate-600">Opal HealthCare</td>
                  <td className="px-6 py-4">
                     <ProgressBar current={12} max={120} color="amber" />
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold">Lagging</span></td>
               </tr>
               <tr>
                  <td className="px-6 py-4 font-bold text-indigo-600">Emma Nguyen</td>
                  <td className="px-6 py-4 text-slate-600">Goodstart Early Learning</td>
                  <td className="px-6 py-4">
                     <ProgressBar current={120} max={120} color="emerald" />
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">Ready for Signoff</span></td>
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  )
}

function StudentMock() {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-sm w-full mx-auto">
      <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden aspect-[9/19] flex flex-col relative">
         <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-2xl mx-16 z-10"></div>
         
         <div className="bg-indigo-600 p-6 pt-10 text-white text-center pb-16 relative">
            <h3 className="font-bold text-xl mb-1">Hi, Sarah 👋</h3>
            <p className="text-indigo-200 text-sm">Blue Care (Springwood)</p>
         </div>
         
         <div className="flex-1 bg-slate-50 px-6 -mt-10 rounded-t-3xl flex flex-col gap-4 pt-6 relative overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
               <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Logged Hours</div>
               <div className="text-5xl font-black text-indigo-700 mb-2">96</div>
               <div className="text-slate-500 text-sm font-medium">out of 120 required</div>
               <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden">
                  <div className="bg-indigo-500 h-3 rounded-full w-[80%]"></div>
               </div>
            </div>
            
            <button className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
               <Clock className="w-5 h-5"/> Log New Shift
            </button>
            
            <div className="mt-2">
               <h4 className="font-bold text-slate-800 mb-3 text-sm">Recent Logs</h4>
               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center mb-3 border-l-4 border-l-emerald-500">
                  <div>
                     <div className="font-bold text-slate-900 text-sm">Today, 9:00 AM</div>
                     <div className="text-xs text-slate-500">8 hours • Aged Care Ward</div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500"/>
               </div>
               <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center border-l-4 border-l-amber-500">
                  <div>
                     <div className="font-bold text-slate-900 text-sm">Yesterday, 9:00 AM</div>
                     <div className="text-xs text-slate-500">8 hours • Aged Care Ward</div>
                  </div>
                  <Clock className="w-5 h-5 text-amber-500"/>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

function SupervisorMock() {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 max-w-sm w-full mx-auto">
      <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden aspect-[9/19] flex flex-col relative">
         <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-2xl mx-16 z-10"></div>
         
         <div className="bg-white p-6 pt-12 border-b border-slate-200">
            <h3 className="font-extrabold text-xl text-slate-900 mb-1">Supervisor Portal</h3>
            <p className="text-slate-500 text-sm font-medium">Pending Approvals</p>
         </div>
         
         <div className="flex-1 bg-slate-50 p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4 border-l-4 border-l-indigo-500">
               <div className="flex justify-between items-start mb-3">
                  <div>
                     <div className="font-bold text-slate-900">Sarah Jenkins</div>
                     <div className="text-xs text-slate-500 font-medium">Student RN</div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">8.0 hrs</span>
               </div>
               <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 "Assisted with morning rounds, medication prep, and vital sign recording in Ward 3."
               </div>
               <div className="flex gap-2">
                 <button className="flex-1 bg-emerald-100 text-emerald-700 font-bold py-2 rounded-lg text-sm">Approve</button>
                 <button className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-lg text-sm">Reject</button>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4 border-l-4 border-l-indigo-500">
               <div className="flex justify-between items-start mb-3">
                  <div>
                     <div className="font-bold text-slate-900">Mark Taylor</div>
                     <div className="text-xs text-slate-500 font-medium">Student RN</div>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">6.5 hrs</span>
               </div>
               <div className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 "Shadowed senior nurse during patient intake."
               </div>
               <div className="flex gap-2">
                 <button className="flex-1 bg-emerald-100 text-emerald-700 font-bold py-2 rounded-lg text-sm">Approve</button>
                 <button className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-lg text-sm">Reject</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

function TrainerMock() {
  return (
    <div className="w-full animate-in fade-in duration-500 bg-white border border-slate-200 rounded-xl shadow-sm p-6 h-full">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Trainer Portal</h3>
          <p className="text-sm text-slate-500 mt-1">Review student journals, evidence, and log monitoring visits.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">SJ</div>
              <div>
                <h4 className="font-bold text-slate-900">Sarah Jenkins</h4>
                <p className="text-xs text-slate-500 font-medium">Cert III Early Childhood</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Weekly Journal</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14}/> Submitted</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Hours Logged</span>
                <span className="text-slate-900 font-bold">96/120</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Host Approval</span>
                <span className="text-emerald-600 font-bold">Verified</span>
              </div>
            </div>
            <button className="w-full mt-5 bg-slate-900 text-white py-2 rounded-lg font-bold text-sm">Log Monitoring Visit</button>
         </div>

         <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold">LS</div>
              <div>
                <h4 className="font-bold text-slate-900">Liam Smith</h4>
                <p className="text-xs text-slate-500 font-medium">Diploma of Nursing</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Weekly Journal</span>
                <span className="text-rose-600 font-bold flex items-center gap-1"><Clock size={14}/> Overdue</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Hours Logged</span>
                <span className="text-rose-600 font-bold">12/120</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Host Approval</span>
                <span className="text-amber-600 font-bold">Pending</span>
              </div>
            </div>
            <button className="w-full mt-5 bg-rose-50 text-rose-600 py-2 rounded-lg font-bold text-sm">Send Reminder</button>
         </div>
      </div>
    </div>
  )
}

function HostMock() {
  return (
    <div className="w-full animate-in fade-in duration-500 bg-white border border-slate-200 rounded-xl shadow-sm p-6 h-full">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Host Manager Portal</h3>
          <p className="text-sm text-slate-500 mt-1">Manage active placements, approve agreements, and assign supervisors.</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileCheck className="text-indigo-600"/> Pending Tripartite Agreements</h4>
        
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
           <div>
             <div className="font-bold text-indigo-700 text-lg">Emma Nguyen</div>
             <div className="text-sm text-slate-600 mb-2">Requested Placement: 120 Hours (Jan 2026 - Jun 2026)</div>
             <div className="text-xs text-slate-500">Institution: ICQA (Institute of Child Quality Assurance)</div>
           </div>
           <div className="flex gap-3">
             <button className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-lg text-sm">Review Terms</button>
             <button className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md">Sign Agreement digitally</button>
           </div>
        </div>
      </div>
    </div>
  )
}


// ─── Helpers ──────────────────────────────────────────────────────────

function MetricBox({ title, value, subtitle, color, invert }: any) {
  const bg = invert ? 'bg-amber-50' : `bg-${color}-50`;
  const text = invert ? 'text-amber-600' : `text-${color}-700`;
  return (
    <div className={`border border-slate-200 rounded-xl p-5 ${bg}`}>
      <div className="text-sm font-semibold text-slate-600 mb-1">{title}</div>
      <div className={`text-4xl font-extrabold ${text}`}>{value}</div>
      <div className="text-xs font-medium text-slate-500 mt-2">{subtitle}</div>
    </div>
  )
}

function ProgressBar({ current, max, color }: any) {
  const pct = Math.min((current/max)*100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
         <div className={`bg-${color}-500 h-2 rounded-full`} style={{ width: `${pct}%` }}></div>
      </div>
      <span className="text-xs font-medium text-slate-600">{current}/{max}h</span>
    </div>
  )
}
