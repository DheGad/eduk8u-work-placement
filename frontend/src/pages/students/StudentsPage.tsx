import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listStudents } from '@/api/endpoints/students';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const riskBadge: Record<string, string> = { none: 'bg-[#111111] text-[#A1A1AA] border-[#222222]', low: 'bg-blue-500/10 text-blue-400 border-blue-500/20', medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20', high: 'bg-red-500/10 text-red-400 border-red-500/20', critical: 'bg-red-500/10 text-red-400 border-red-500/20' };
const riskLabel: Record<string, string> = { none: 'Clear', low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const statusBadge: Record<string, string> = { active: 'bg-blue-500/10 text-blue-400 border-blue-500/20', completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', not_started: 'bg-[#111111] text-[#A1A1AA] border-[#222222]' };

// Create Student Modal
const CreateStudentModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', dob: '', address: '', emergency_contact: '', emergency_phone: '' });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-[#222222] rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#222222] bg-[#0F0F0F]">
          <h2 className="text-[15px] font-semibold text-white tracking-tight">Enrol New Student</h2>
          <button className="text-[#71717A] hover:text-white transition-colors" onClick={onClose}><XCircle size={18} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'first_name', label: 'First Name *', type: 'text', placeholder: 'e.g. Sarah' },
              { key: 'last_name', label: 'Last Name *', type: 'text', placeholder: 'e.g. Jenkins' },
              { key: 'email', label: 'Email Address *', type: 'email', placeholder: 'student@icqa.edu.au' },
              { key: 'phone', label: 'Mobile Phone *', type: 'tel', placeholder: '04XX XXX XXX' },
              { key: 'dob', label: 'Date of Birth', type: 'date', placeholder: '' },
              { key: 'address', label: 'Home Address', type: 'text', placeholder: 'Street, Suburb, State, Postcode' },
              { key: 'emergency_contact', label: 'Emergency Contact Name', type: 'text', placeholder: 'Full name' },
              { key: 'emergency_phone', label: 'Emergency Contact Phone', type: 'tel', placeholder: '04XX XXX XXX' },
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#A1A1AA]">{f.label}</label>
                <input className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white placeholder-[#71717A] focus:outline-none focus:border-blue-500" type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-1.5 mt-2">
              <label className="text-[12px] font-medium text-[#A1A1AA]">Course *</label>
              <select className="h-9 px-3 rounded-md border border-[#333333] bg-[#0F0F0F] text-[13px] text-white focus:outline-none focus:border-blue-500">
                <option>CHC33021 Certificate III in Individual Support</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button className="h-9 px-4 rounded-md border border-[#333333] hover:bg-[#1A1A1A] text-white text-[13px] font-medium transition-colors" onClick={onClose}>Cancel</button>
            <button className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center" onClick={() => { alert('Student enrolled!'); onClose(); }}>
              <Plus size={16} className="mr-2" /> Enrol Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentsPage: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery({
    queryKey: ['students', { search: '' }],
    queryFn: () => listStudents({ search: '' })
  });

  const students = result?.data || [];

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorFn: row => `${row.first_name} ${row.last_name}`,
      id: 'name',
      header: 'Student',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center text-[#A1A1AA] font-medium text-[13px] shrink-0">
              {row.first_name?.[0]}{row.last_name?.[0]}
            </div>
            <div>
              <div className="font-medium text-white tracking-tight">{row.first_name} {row.last_name}</div>
              <div className="text-[12px] text-[#71717A] mt-0.5">{row.student_number} · {row.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'course',
      header: 'Course',
      cell: () => <span className="text-[13px] text-[#A1A1AA]">CHC33021</span>
    },
    {
      accessorKey: 'hours_completed',
      header: 'Hours Progress',
      cell: info => {
        const completed = info.getValue() || 0;
        const required = 120;
        const percent = Math.min((completed / required) * 100, 100);
        return (
          <div className="flex items-center gap-3 w-32">
            <div className="flex-1 h-1.5 bg-[#222222] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${completed >= required ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
            </div>
            <span className="text-[12px] text-[#71717A] whitespace-nowrap">{completed}/{required}h</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'compliance_score',
      header: 'Compliance',
      cell: info => {
        const score = info.getValue() || 0;
        return (
          <span className={`font-semibold ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {score}%
          </span>
        );
      }
    },
    {
      accessorKey: 'risk_level',
      header: 'Risk',
      cell: info => {
        const risk = info.getValue() || 'none';
        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${riskBadge[risk] || riskBadge.none}`}>
            {riskLabel[risk] || risk}
          </span>
        );
      }
    },
    {
      id: 'status',
      accessorFn: row => row.active_placement_count > 0 ? 'active' : (row.hours_completed >= 120 ? 'completed' : 'not_started'),
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const label = status === 'not_started' ? 'Not Started' : status.charAt(0).toUpperCase() + status.slice(1);
        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadge[status] || statusBadge.not_started}`}>
            {label}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/students/${info.row.original.id}`); }}
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#222222] text-[#71717A] hover:text-white transition-colors"
        >
          <Eye size={16} />
        </button>
      )
    }
  ], [navigate]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6 animate-in fade-in duration-500 min-h-screen bg-black">
      <CreateStudentModal open={showCreate} onClose={() => setShowCreate(false)} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Students</h1>
          <p className="text-[#A1A1AA] text-[13px] mt-1">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        <button 
          className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-100 text-[13px] font-semibold transition-colors flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} className="mr-2" /> Enrol Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Enrolled', value: students.length, color: 'text-white' },
          { label: 'Active Placements', value: students.filter((s: any) => s.active_placement_count > 0).length, color: 'text-blue-400' },
          { label: 'Completed', value: students.filter((s: any) => s.hours_completed >= 120).length, color: 'text-emerald-400' },
          { label: 'At Risk', value: students.filter((s: any) => ['high', 'critical'].includes(s.risk_level || 'none')).length, color: 'text-red-400' },
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
        data={students} 
        loading={isLoading} 
        onRowClick={(row) => navigate(`/students/${row.id}`)}
        exportName="Students-Export"
      />
    </div>
  );
};

export default StudentsPage;
