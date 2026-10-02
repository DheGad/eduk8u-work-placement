import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, XCircle, Eye, UserCheck } from 'lucide-react';
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useQuery } from '@tanstack/react-query';
import { listSupervisors } from '@/api/endpoints/supervisors';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const qualConfig: Record<string, { cls: string; label: string }> = {
  verified: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Verified' },
  pending_verification: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Pending Verification' },
  rejected: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Rejected' },
};

const briefingConfig: Record<string, { cls: string; label: string }> = {
  completed: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Briefing Done' },
  in_progress: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'In Progress' },
  not_started: { cls: 'bg-[#111111] text-[#A1A1AA] border-[#222222]', label: 'Not Started' },
};

import { createSupervisor } from '@/api/endpoints/supervisors';
import { listHosts } from '@/api/endpoints/hosts';

const CreateSupervisorModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', position_title: '', years_experience: '', host_facility_id: '' });
  const queryClient = useQueryClient();
  
  const { data: hostsData } = useQuery({
    queryKey: ['hosts', { search: '' }],
    queryFn: () => listHosts({ search: '' })
  });
  const hosts = Array.isArray(hostsData) ? hostsData : (hostsData?.data || []);

  const mutation = useMutation({
    mutationFn: () => createSupervisor(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisors'] });
      setForm({ first_name: '', last_name: '', email: '', phone: '', position_title: '', years_experience: '', host_facility_id: '' });
      onClose();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.error || 'Failed to add supervisor');
    }
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#0F0F0F]">
          <h2 className="text-[15px] font-semibold text-white tracking-tight">Add Supervisor</h2>
          <button className="text-[#71717A] hover:text-white transition-colors" onClick={onClose}><XCircle size={18} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'first_name', label: 'First Name *', type: 'text', placeholder: 'e.g. Margaret' },
              { key: 'last_name', label: 'Last Name *', type: 'text', placeholder: 'e.g. Whitfield' },
              { key: 'email', label: 'Work Email *', type: 'email', placeholder: 'supervisor@facility.org.au' },
              { key: 'phone', label: 'Work Phone *', type: 'tel', placeholder: '07 XXXX XXXX' },
              { key: 'position_title', label: 'Position Title *', type: 'text', placeholder: 'e.g. Registered Nurse' },
              { key: 'years_experience', label: 'Years Experience', type: 'number', placeholder: '5' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#A1A1AA]">{f.label}</label>
                <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Host Facility *</label>
              <select className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" value={form.host_facility_id} onChange={e => setForm(prev => ({ ...prev, host_facility_id: e.target.value }))}>
                <option value="">Select facility…</option>
                {hosts.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.facility_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button className="h-9 px-4 rounded-md border border-[#333333] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors" onClick={onClose} disabled={mutation.isPending}>Cancel</button>
            <button className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              <Plus size={16} className="mr-2" /> {mutation.isPending ? 'Adding...' : 'Add Supervisor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SupervisorsPage: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery({
    queryKey: ['supervisors', { search: '' }],
    queryFn: () => listSupervisors({ search: '' })
  });

  const supervisors = result?.data || [];

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorFn: row => `${row.first_name} ${row.last_name}`,
      id: 'name',
      header: 'Supervisor',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck size={16} />
            </div>
            <div>
              <div className="font-medium text-white tracking-tight">{row.first_name} {row.last_name}</div>
              <div className="text-[12px] text-[#71717A] mt-0.5">{row.position_title} · {row.years_experience || 0} yrs exp</div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'facility_name',
      header: 'Host Facility',
      cell: info => <span className="text-[13px] text-[#A1A1AA]">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'qualification_status',
      header: 'Qualifications',
      cell: info => {
        const status = info.getValue() as string;
        const conf = qualConfig[status] || qualConfig.pending_verification;
        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${conf.cls}`}>
            {conf.label}
          </span>
        );
      }
    },
    {
      accessorKey: 'briefing_status',
      header: 'Briefing (CA 0401)',
      cell: info => {
        const status = info.getValue() as string;
        const conf = briefingConfig[status] || briefingConfig.not_started;
        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${conf.cls}`}>
            {conf.label}
          </span>
        );
      }
    },
    {
      accessorKey: 'students_assigned',
      header: 'Students',
      cell: info => <span className="text-[13px] font-medium text-white">{info.getValue() as number || 0}</span>
    },
    {
      accessorKey: 'hours_approved',
      header: 'Hours Approved',
      cell: info => <span className="text-[13px] font-medium text-white">{info.getValue() as number || 0}h</span>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/supervisors/${info.row.original.id}`); }}
            className="w-7 h-7 rounded hover:bg-[#222222] flex items-center justify-center text-[#71717A] hover:text-white transition-colors"
          >
            <Eye size={15} />
          </button>
          {info.row.original.qualification_status === 'pending_verification' && (
            <button 
              onClick={(e) => { e.stopPropagation(); alert('Supervisor verified!'); }}
              className="h-7 px-2 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] font-medium transition-colors"
            >
              Verify
            </button>
          )}
        </div>
      )
    }
  ], [navigate]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6 animate-in fade-in duration-500 min-h-screen bg-black">
      <CreateSupervisorModal open={showCreate} onClose={() => setShowCreate(false)} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Supervisors</h1>
          <p className="text-[#A1A1AA] text-[13px] mt-1">{supervisors.length} supervisors registered</p>
        </div>
        <button 
          className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} className="mr-2" /> Add Supervisor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Supervisors', value: supervisors.length, color: 'text-white' },
          { label: 'Verified', value: supervisors.filter((s: any) => s.qualification_status === 'verified').length, color: 'text-emerald-400' },
          { label: 'Briefings Complete', value: supervisors.filter((s: any) => s.briefing_status === 'completed').length, color: 'text-blue-400' },
          { label: 'Pending Verification', value: supervisors.filter((s: any) => s.qualification_status !== 'verified').length, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-[#222222] bg-[#0A0A0A] p-5">
            <div className={`text-3xl font-semibold tracking-tighter ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-[13px] font-medium text-[#71717A] tracking-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns} 
        data={supervisors} 
        loading={isLoading} 
        onRowClick={(row) => navigate(`/supervisors/${row.id}`)}
        exportName="Supervisors-Export"
      />
    </div>
  );
};

export default SupervisorsPage;
