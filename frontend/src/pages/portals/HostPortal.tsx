import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, FileSignature, AlertCircle, Check, X, Star } from 'lucide-react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';
import MyTasksWidget from '@/components/shared/MyTasksWidget';

export default function HostPortal() {
  const { data, isLoading } = useQuery({
    queryKey: ['host-dashboard'],
    queryFn: async () => (await apiClient.get('/host-portal/dashboard')).data.data
  });

  const [activeTab, setActiveTab] = useState("active");

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Host Portal...</div>;

  const { activePlacements = [], stats = {} } = data || {};
  
  // Mock pending placements for the UI Journey
  const pendingPlacements = [
    { id: 1, student_first: "Sarah", student_last: "Connor", facility_name: "BlueCare Respite Centre", requested_dates: "Oct 2024 - Dec 2024", hours: 120 }
  ];

  const handleAction = (action: string) => {
    toast.success(`Placement ${action} successfully`);
  };

  return (
    <div className="page-content">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-500" />
            Host Facility Portal
          </h1>
          <p className="text-slate-500 mt-1">Manage your active students, evaluate facilities, and digitally sign-off completions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-slate-700">Active</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.active_students || 0}</p>
        </div>
        
        <div className="card p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-slate-700">Facilities</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.facilities_managed?.c || 0}</p>
        </div>

        <div className="card p-6 border-l-4 border-l-amber-500 cursor-pointer hover:bg-amber-50" onClick={() => setActiveTab("pending")}>
          <div className="flex items-center gap-3 mb-2">
            <FileSignature className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-700">Pending</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">1</p>
        </div>
        
        <div className="card p-6 border-l-4 border-l-purple-500 cursor-pointer hover:bg-purple-50" onClick={() => setActiveTab("evaluations")}>
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-slate-700">Evaluations</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">0</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          
          <div className="flex gap-4 border-b border-slate-200 mb-6">
            <button className={`pb-2 px-1 font-medium ${activeTab==="active" ? "border-b-2 border-indigo-500 text-indigo-600":"text-slate-500"}`} onClick={() => setActiveTab("active")}>Active Placements</button>
            <button className={`pb-2 px-1 font-medium ${activeTab==="pending" ? "border-b-2 border-amber-500 text-amber-600":"text-slate-500"}`} onClick={() => setActiveTab("pending")}>Pending Approval</button>
            <button className={`pb-2 px-1 font-medium ${activeTab==="evaluations" ? "border-b-2 border-purple-500 text-purple-600":"text-slate-500"}`} onClick={() => setActiveTab("evaluations")}>Evaluations & Sign-offs</button>
          </div>
          
          {activeTab === "active" && (
            <div className="card table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Facility</th>
                    <th>Phase</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activePlacements.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-slate-500 py-8">No active students.</td></tr>
                  ) : (
                    activePlacements.map((p: any) => (
                      <tr key={p.id}>
                        <td>
                          <div className="font-medium text-slate-900">{p.student_first} {p.student_last}</div>
                        </td>
                        <td className="text-sm text-slate-600">{p.facility_name}</td>
                        <td><span className="badge badge-primary">{p.current_phase}</span></td>
                        <td><button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Evaluate</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {activeTab === "pending" && (
            <div className="card table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Facility</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPlacements.map(p => (
                    <tr key={p.id}>
                      <td><div className="font-medium">{p.student_first} {p.student_last}</div></td>
                      <td className="text-sm">{p.facility_name}</td>
                      <td className="text-sm">{p.requested_dates}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-primary bg-emerald-600 border-emerald-600 px-2 py-1 text-xs" onClick={() => handleAction("Accepted")}><Check className="w-3 h-3"/></button>
                          <button className="btn btn-secondary text-red-600 px-2 py-1 text-xs" onClick={() => handleAction("Rejected")}><X className="w-3 h-3"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "evaluations" && (
            <div className="card p-12 text-center text-slate-500">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p>No pending student evaluations or final sign-offs required.</p>
            </div>
          )}
          
        </div>
        <div>
          <MyTasksWidget />
        </div>
      </div>
    </div>
  );
}
