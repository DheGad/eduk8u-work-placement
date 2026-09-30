import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, XCircle, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listHosts } from '@/api/endpoints/hosts';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const approvalConfig: Record<string, { cls: string; label: string }> = {
  approved: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Approved' },
  pending: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Pending Review' },
  rejected: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Rejected' },
  suspended: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Suspended' },
};

const CreateHostModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ facility_name: '', abn: '', facility_type: 'Residential Aged Care', suburb: '', state: 'QLD', postcode: '', phone: '', email: '', contact_name: '', contact_role: '' });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#0F0F0F]">
          <h2 className="text-[15px] font-semibold text-white tracking-tight">Add Host Facility</h2>
          <button className="text-[#71717A] hover:text-white transition-colors" onClick={onClose}><XCircle size={18} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Facility Name *</label>
              <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" placeholder="e.g. BlueCare Respite Centre" value={form.facility_name} onChange={e => setForm(f => ({ ...f, facility_name: e.target.value }))} />
            </div>
            {[
              { key: 'abn', label: 'ABN', type: 'text', placeholder: 'XX XXX XXX XXX' },
              { key: 'suburb', label: 'Suburb *', type: 'text', placeholder: 'e.g. Indooroopilly' },
              { key: 'phone', label: 'Phone', type: 'tel', placeholder: '0X XXXX XXXX' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'hello@host.com.au' },
              { key: 'contact_name', label: 'Primary Contact Name *', type: 'text', placeholder: 'Full name' },
              { key: 'contact_role', label: 'Contact Role', type: 'text', placeholder: 'e.g. Facility Manager' }
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#A1A1AA]">{f.label}</label>
                <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button className="h-9 px-4 rounded-md border border-[#333333] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors" onClick={onClose}>Cancel</button>
            <button className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center" onClick={() => { alert('Host facility added!'); onClose(); }}>
              <Plus size={16} className="mr-2" /> Add Host Facility
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HostsPage: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery({
    queryKey: ['hosts', { search: '' }],
    queryFn: () => listHosts({ search: '' })
  });

  const hosts = Array.isArray(result) ? result : (result?.data || []);

  const isInsuranceExpiring = (expiry?: string) => {
    if (!expiry) return true;
    const days = (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days < 90;
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: 'facility_name',
      header: 'Facility Name',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
              <Building2 size={18} />
            </div>
            <div>
              <div className="font-medium text-white tracking-tight">{row.facility_name}</div>
              <div className="text-[12px] text-[#71717A] mt-0.5">{row.suburb}, {row.state}</div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'facility_type',
      header: 'Type',
      cell: info => <span className="text-[13px] text-[#A1A1AA]">{info.getValue() || 'Residential Aged Care'}</span>
    },
    {
      id: 'capacity',
      header: 'Placements / Capacity',
      cell: info => {
        const row = info.row.original;
        const active = row.active_placements || 0;
        const capacity = row.student_capacity || 0;
        return (
          <span className="text-[13px] text-[#A1A1AA]"><strong className="text-white">{active}</strong> / {capacity}</span>
        );
      }
    },
    {
      accessorKey: 'approval_status',
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const conf = approvalConfig[status] || approvalConfig.pending;
        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${conf.cls}`}>
            {conf.label}
          </span>
        );
      }
    },
    {
      id: 'insurance',
      header: 'Insurance Status',
      cell: info => {
        const row = info.row.original;
        const expiring = isInsuranceExpiring(row.insurance_expiry);
        return (
          <div className="flex items-center gap-1.5">
            {expiring ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className={`text-[12px] font-medium ${expiring ? 'text-amber-500' : 'text-[#71717A]'}`}>
              {expiring ? (row.insurance_expiry ? 'Expiring Soon' : 'Missing') : 'Valid'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/hosts/${info.row.original.id}`); }}
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#222222] text-[#71717A] hover:text-white transition-colors"
        >
          <Eye size={16} />
        </button>
      )
    }
  ], [navigate]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6 animate-in fade-in duration-500 min-h-screen bg-black">
      <CreateHostModal open={showCreate} onClose={() => setShowCreate(false)} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Host Facilities</h1>
          <p className="text-[#A1A1AA] text-[13px] mt-1">{hosts.length} registered facilities</p>
        </div>
        <button 
          className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} className="mr-2" /> Add Facility
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Hosts', value: hosts.length, color: 'text-white' },
          { label: 'Active Placements', value: (hosts as any[]).reduce((s: number, h: any) => s + (h.active_placements || 0), 0), color: 'text-blue-400' },
          { label: 'Total Capacity', value: (hosts as any[]).reduce((s: number, h: any) => s + (h.student_capacity || 0), 0), color: 'text-emerald-400' },
          { label: 'Insurance Expiring', value: hosts.filter((h: any) => isInsuranceExpiring(h.insurance_expiry)).length, color: 'text-amber-400' },
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
        data={hosts} 
        loading={isLoading} 
        onRowClick={(row) => navigate(`/hosts/${row.id}`)}
        exportName="Hosts-Export"
      />
    </div>
  );
};

export default HostsPage;
