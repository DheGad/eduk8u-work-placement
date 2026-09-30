import React, { useState, useMemo } from 'react';
import { UsersRound, Plus, ShieldCheck, Mail, Clock, Check, X, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const ROLES = ['super_admin', 'college_admin', 'trainer', 'student', 'supervisor', 'host_manager', 'auditor'];

const roleColors: Record<string, string> = {
  super_admin: '#ef4444',
  college_admin: '#f59e0b',
  trainer: '#6366f1',
  student: '#10b981',
  supervisor: '#60a5fa',
  host_manager: '#a78bfa',
  auditor: '#34d399',
};

const InviteModal = ({ open, onClose, onSubmit, isPending }: any) => {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'trainer', password: '' });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#0F0F0F]">
          <h2 className="text-[15px] font-semibold text-white tracking-tight">Invite New User</h2>
          <button className="text-[#71717A] hover:text-white transition-colors" onClick={onClose}><XCircle size={18} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">First Name *</label>
              <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Jane" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Last Name *</label>
              <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Smith" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Email Address *</label>
              <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane.smith@icqa.edu.au" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Role *</label>
              <select className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Temporary Password *</label>
              <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 8 characters" />
              <p className="text-[11px] text-[#71717A] mt-1">User must change password on first login.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button className="h-9 px-4 rounded-md border border-[#333333] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors" onClick={onClose}>Cancel</button>
            <button 
              className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={() => onSubmit(form)}
              disabled={isPending || !form.email || !form.first_name || !form.password}
            >
              {isPending ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserManagement: React.FC = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: users = [], isLoading: loadingUsers } = useQuery({ 
    queryKey: ['users'], 
    queryFn: async () => (await apiClient.get('/users')).data.data 
  });

  const { data: pendingUsers = [], isLoading: loadingPending } = useQuery({ 
    queryKey: ['users', 'pending'], 
    queryFn: async () => (await apiClient.get('/admin/users/pending')).data.data 
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/users', data),
    onSuccess: (_, variables) => {
      toast.success(`Account created for ${variables.first_name}`);
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowInviteModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to create user'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => apiClient.patch(`/users/${id}`, { is_active: active }),
    onSuccess: (_, { active }) => { toast.success(active ? 'User activated' : 'User deactivated'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Failed to update user'),
  });

  const approveUserMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/users/${id}/approve`),
    onSuccess: () => { 
      toast.success('User approved'); 
      qc.invalidateQueries({ queryKey: ['users'] }); 
      qc.invalidateQueries({ queryKey: ['users', 'pending'] });
    },
    onError: () => toast.error('Failed to approve user'),
  });

  const rejectUserMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/users/${id}/reject`),
    onSuccess: () => { 
      toast.success('User rejected'); 
      qc.invalidateQueries({ queryKey: ['users'] }); 
      qc.invalidateQueries({ queryKey: ['users', 'pending'] });
    },
    onError: () => toast.error('Failed to reject user'),
  });

  const activeColumns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorFn: row => `${row.first_name} ${row.last_name}`,
      id: 'name',
      header: 'User',
      cell: info => {
        const row = info.row.original;
        const initials = `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`.toUpperCase();
        const color = roleColors[row.role] || '#94a3b8';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 border" style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}>
              {initials}
            </div>
            <div>
              <div className="font-medium text-white tracking-tight">{row.first_name} {row.last_name}</div>
              <div className="text-[12px] text-[#71717A] mt-0.5">{row.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: info => {
        const role = info.getValue() as string;
        const color = roleColors[role] || '#94a3b8';
        return (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border tracking-wide uppercase" style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}>
            {role?.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    {
      accessorKey: 'last_login_at',
      header: 'Last Login',
      cell: info => {
        const date = info.getValue() as string;
        return <span className="text-[13px] text-[#A1A1AA]">{date ? new Date(date).toLocaleDateString('en-AU') : 'Never'}</span>;
      }
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: info => {
        const isActive = info.getValue() as boolean;
        return (
          <div className="flex items-center gap-1.5">
            {isActive ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-[#71717A]" />}
            <span className={`text-[12px] font-medium ${isActive ? 'text-emerald-500' : 'text-[#71717A]'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const row = info.row.original;
        return (
          <button
            className={`h-7 px-3 rounded text-[11px] font-medium transition-colors ${row.is_active ? 'bg-[#222222] text-[#A1A1AA] hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'}`}
            onClick={(e) => { e.stopPropagation(); toggleActiveMutation.mutate({ id: row.id, active: !row.is_active }); }}
            disabled={toggleActiveMutation.isPending}
          >
            {row.is_active ? 'Deactivate' : 'Activate'}
          </button>
        );
      }
    }
  ], []);

  const pendingColumns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorFn: row => `${row.first_name} ${row.last_name}`,
      id: 'name',
      header: 'User',
      cell: info => {
        const row = info.row.original;
        const initials = `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`.toUpperCase();
        const color = roleColors[row.role] || '#94a3b8';
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 border" style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}>
              {initials}
            </div>
            <div>
              <div className="font-medium text-white tracking-tight">{row.first_name} {row.last_name}</div>
              <div className="text-[12px] text-[#71717A] mt-0.5">{row.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'role',
      header: 'Requested Role',
      cell: info => {
        const role = info.getValue() as string;
        const color = roleColors[role] || '#94a3b8';
        return (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border tracking-wide uppercase" style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}>
            {role?.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Registered At',
      cell: info => <span className="text-[13px] text-[#A1A1AA]">{new Date(info.getValue() as string).toLocaleString('en-AU')}</span>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              className="h-7 px-3 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] font-medium transition-colors flex items-center gap-1"
              onClick={() => approveUserMutation.mutate(row.id)}
              disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
            >
              <Check size={12} /> Approve
            </button>
            <button
              className="h-7 px-3 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[11px] font-medium transition-colors flex items-center gap-1"
              onClick={() => rejectUserMutation.mutate(row.id)}
              disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
            >
              <X size={12} /> Reject
            </button>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6 animate-in fade-in duration-500 min-h-screen bg-black">
      <InviteModal 
        open={showInviteModal} 
        onClose={() => setShowInviteModal(false)} 
        onSubmit={(form: any) => createUserMutation.mutate(form)}
        isPending={createUserMutation.isPending}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">User Management</h1>
          <p className="text-[#A1A1AA] text-[13px] mt-1">Manage access, roles, and accounts across your RTO</p>
        </div>
        <button 
          className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
          onClick={() => setShowInviteModal(true)}
        >
          <Plus size={16} className="mr-2" /> Invite User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#222222]">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative ${activeTab === 'active' ? 'text-white' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
        >
          Active Users
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative flex items-center gap-2 ${activeTab === 'pending' ? 'text-white' : 'text-[#71717A] hover:text-[#A1A1AA]'}`}
        >
          Pending Approvals
          {pendingUsers.length > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
              {pendingUsers.length}
            </span>
          )}
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />}
        </button>
      </div>

      {/* Tables */}
      <div className="mt-4">
        {activeTab === 'active' ? (
          <DataTable 
            columns={activeColumns} 
            data={users} 
            loading={loadingUsers} 
            exportName="Users-Export"
          />
        ) : (
          pendingUsers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center border border-[#222222] bg-[#0A0A0A] rounded-xl">
              <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-[15px] font-medium text-white">All caught up!</h3>
              <p className="text-[13px] text-[#A1A1AA] mt-1">No pending user registrations await your approval.</p>
            </div>
          ) : (
            <DataTable 
              columns={pendingColumns} 
              data={pendingUsers} 
              loading={loadingPending} 
              exportName="Pending-Users-Export"
            />
          )
        )}
      </div>
    </div>
  );
};

export default UserManagement;
