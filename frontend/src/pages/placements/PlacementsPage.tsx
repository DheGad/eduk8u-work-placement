import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, XCircle, Eye, Edit2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listPlacements } from '@/api/endpoints/placements';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const riskConfig: Record<string, { label: string; cls: string }> = {
  none: { label: 'No Risk', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  low: { label: 'Low', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  medium: { label: 'Medium', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  high: { label: 'High', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  critical: { label: 'Critical', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const phaseConfig: Record<string, { cls: string }> = {
  setup: { cls: 'bg-[#111111] text-[#A1A1AA] border-[#222222]' },
  agreement: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  active: { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  monitoring: { cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  completed: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

const CreatePlacementModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ student_id: '', host_id: '', supervisor_id: '', start_date: '', end_date: '', workflow_id: '' });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#0F0F0F]">
          <h2 className="text-[15px] font-semibold text-white tracking-tight">Create New Placement</h2>
          <button className="text-[#71717A] hover:text-white transition-colors" onClick={onClose}><XCircle size={18} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Student *</label>
              <select className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}>
                <option value="">Select student…</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Host Facility *</label>
              <select className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" value={form.host_id} onChange={e => setForm(f => ({ ...f, host_id: e.target.value }))}>
                <option value="">Select host…</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Supervisor *</label>
              <select className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" value={form.supervisor_id} onChange={e => setForm(f => ({ ...f, supervisor_id: e.target.value }))}>
                <option value="">Select supervisor…</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Course / Workflow</label>
              <select className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" value={form.workflow_id} onChange={e => setForm(f => ({ ...f, workflow_id: e.target.value }))}>
                <option value="">CHC33021 Certificate III Individual Support</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Start Date *</label>
              <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Planned End Date</label>
              <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-md text-[13px] text-blue-100">
            <strong className="text-blue-400 font-semibold mr-1">Note:</strong> Creating this placement will trigger the CA 0355 Tripartite Agreement workflow. All three parties (Student, Host, RTO) must sign before hours can be logged.
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button className="h-9 px-4 rounded-md border border-[#333333] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors" onClick={onClose}>Cancel</button>
            <button className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center" onClick={() => { alert('Placement created!'); onClose(); }}>
              <Plus size={16} className="mr-2" /> Create Placement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PlacementsPage: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery({
    queryKey: ['placements', { search: '', phase: 'all', risk: 'all' }],
    queryFn: () => listPlacements({ search: '', phase: 'all', risk: 'all' })
  });

  const placements = result?.data || [];

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: 'placement_ref',
      header: 'Placement ID',
      cell: info => <span className="font-mono text-[12px] text-blue-400 font-medium bg-blue-500/10 px-2 py-1 rounded">{info.getValue() as string}</span>
    },
    {
      accessorFn: row => `${row.student.first_name} ${row.student.last_name}`,
      id: 'student',
      header: 'Student',
      cell: info => (
        <div>
          <div className="font-medium text-white tracking-tight">{info.row.original.student.first_name} {info.row.original.student.last_name}</div>
          <div className="text-[12px] text-[#71717A] mt-0.5">{info.row.original.student.student_number}</div>
        </div>
      )
    },
    {
      accessorFn: row => row.host.facility_name,
      id: 'host',
      header: 'Host Facility',
      cell: info => <span className="text-[13px] text-[#A1A1AA]">{info.getValue() as string}</span>
    },
    {
      accessorFn: row => `${row.supervisor.first_name} ${row.supervisor.last_name}`,
      id: 'supervisor',
      header: 'Supervisor',
      cell: info => <span className="text-[13px] text-[#A1A1AA]">{info.getValue() as string}</span>
    },
    {
      accessorKey: 'hours_completed',
      header: 'Hours',
      cell: info => {
        const completed = info.getValue() as number || 0;
        const required = info.row.original.hours_required || 120;
        const percent = Math.min((completed / required) * 100, 100);
        return (
          <div className="flex flex-col gap-1 w-24">
            <div className="flex justify-between text-[11px] text-[#A1A1AA]">
              <span className="font-medium text-white">{completed}</span>
              <span>/{required}</span>
            </div>
            <div className="h-1.5 bg-[#222222] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'compliance_score',
      header: 'Compliance',
      cell: info => {
        const score = info.getValue() as number || 0;
        return (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] ${score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : score >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
            {score}%
          </div>
        );
      }
    },
    {
      accessorKey: 'risk_level',
      header: 'Risk',
      cell: info => {
        const risk = info.getValue() as string || 'none';
        const conf = riskConfig[risk] || riskConfig.none;
        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${conf.cls}`}>
            {conf.label}
          </span>
        );
      }
    },
    {
      accessorKey: 'current_phase',
      header: 'Phase',
      cell: info => {
        const phase = info.getValue() as string;
        const label = info.row.original.phase_label;
        const conf = phaseConfig[phase] || phaseConfig.setup;
        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${conf.cls}`}>
            {label}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/placements/${info.row.original.id}`); }} className="w-7 h-7 rounded hover:bg-[#222222] flex items-center justify-center text-[#71717A] hover:text-white transition-colors">
            <Eye size={15} />
          </button>
          <button className="w-7 h-7 rounded hover:bg-[#222222] flex items-center justify-center text-[#71717A] hover:text-white transition-colors">
            <Edit2 size={15} />
          </button>
        </div>
      )
    }
  ], [navigate]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6 animate-in fade-in duration-500 min-h-screen bg-black">
      <CreatePlacementModal open={showCreate} onClose={() => setShowCreate(false)} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Placements</h1>
          <p className="text-[#A1A1AA] text-[13px] mt-1">{placements.length} placement{placements.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/placements/wizard" className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Plus size={16} className="mr-2" /> Create Placement
          </Link>
        </div>
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns} 
        data={placements} 
        loading={isLoading} 
        onRowClick={(row) => navigate(`/placements/${row.id}`)}
        exportName="Placements-Export"
      />
    </div>
  );
};

export default PlacementsPage;
