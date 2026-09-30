import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Phone, Mail, CheckCircle2, XCircle, Clock, Users, Briefcase, ShieldCheck, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

async function fetchHost(id: string) {
  const { data } = await apiClient.get(`/hosts/${id}`);
  return data.data;
}

async function fetchHostPlacements(id: string) {
  const { data } = await apiClient.get(`/placements?host_id=${id}`);
  return data.data;
}

const FieldRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem', padding: '0.625rem 0', borderBottom: '1px solid var(--surface-border)' }}>
    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>{value || '—'}</span>
  </div>
);

const ApprovalBadge = ({ status }: { status: string }) => {
  const colors: Record<string, { bg: string; color: string }> = {
    approved: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    conditionally_approved: { bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
    rejected: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    suspended: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    under_review: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
  };
  const cfg = colors[status] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export const HostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'placements' | 'supervisors'>('overview');

  const { data: host, isLoading } = useQuery({ queryKey: ['host', id], queryFn: () => fetchHost(id!), enabled: !!id });
  const { data: placements = [] } = useQuery({ queryKey: ['host', id, 'placements'], queryFn: () => fetchHostPlacements(id!), enabled: !!id });

  const approveMutation = useMutation({
    mutationFn: () => apiClient.patch(`/hosts/${id}/approve`),
    onSuccess: () => { toast.success('Host facility approved'); qc.invalidateQueries({ queryKey: ['host', id] }); },
    onError: () => toast.error('Failed to approve host'),
  });

  if (isLoading || !host) return (
    <div className="page-content" style={{ textAlign: 'center', padding: '4rem' }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading host details…</p>
    </div>
  );

  const tabs = ['overview', 'placements', 'supervisors'];

  return (
    <div className="page-content">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate('/hosts')}>
        <ArrowLeft size={16} /> Back to Host Facilities
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.08))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={26} style={{ color: 'var(--color-primary-400)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 4 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{host.facility_name}</h1>
                <ApprovalBadge status={host.approval_status} />
              </div>
              {host.trading_name && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Trading as: {host.trading_name}</p>}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <MapPin size={13} /> {[host.suburb, host.state, host.postcode].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {host.approval_status !== 'approved' && (
              <button className="btn btn-success" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                <CheckCircle2 size={16} /> Approve Facility
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
          {[
            { label: 'Student Capacity', value: host.student_capacity || '—', icon: Users },
            { label: 'Current Students', value: host.current_student_count || 0, icon: Briefcase },
            { label: 'Active Placements', value: placements.filter((p: any) => p.status === 'active').length, icon: Clock },
            { label: 'Compliance Status', value: host.approval_status === 'approved' ? 'CA 0393 ✓' : 'Pending', icon: ShieldCheck },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} style={{ padding: '0.625rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === t ? '2px solid var(--color-primary-500)' : '2px solid transparent', color: activeTab === t ? 'var(--color-primary-400)' : 'var(--text-muted)', fontWeight: activeTab === t ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem', marginBottom: -1, textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9375rem' }}>Facility Information</h3>
            <FieldRow label="Facility Type" value={host.facility_type} />
            <FieldRow label="ABN" value={host.abn} />
            <FieldRow label="Address" value={[host.address_line1, host.address_line2].filter(Boolean).join(', ')} />
            <FieldRow label="Suburb" value={host.suburb} />
            <FieldRow label="State" value={host.state} />
            <FieldRow label="Postcode" value={host.postcode} />
            <FieldRow label="Phone" value={host.phone} />
            <FieldRow label="Email" value={host.email} />
            <FieldRow label="Website" value={host.website} />
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9375rem' }}>Primary Contact</h3>
            <FieldRow label="Contact Name" value={host.primary_contact_name} />
            <FieldRow label="Role" value={host.primary_contact_role} />
            <FieldRow label="Phone" value={host.primary_contact_phone} />
            <FieldRow label="Email" value={host.primary_contact_email} />
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval</h4>
              <FieldRow label="Status" value={host.approval_status} />
              {host.approved_at && <FieldRow label="Approved On" value={new Date(host.approved_at).toLocaleDateString('en-AU')} />}
              {host.approval_notes && <FieldRow label="Notes" value={host.approval_notes} />}
            </div>
          </div>
        </div>
      )}

      {/* Placements Tab */}
      {activeTab === 'placements' && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Active & Recent Placements</h3>
          {placements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Briefcase size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No placements for this host yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Student</th><th>Start Date</th><th>Hours</th><th>Status</th><th>Compliance</th></tr></thead>
                <tbody>
                  {placements.map((p: any) => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/placements/${p.id}`)}>
                      <td><strong>{p.student_name || '—'}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.placement_ref}</span></td>
                      <td>{new Date(p.start_date).toLocaleDateString('en-AU')}</td>
                      <td><strong>{p.hours_completed}/{p.hours_required}h</strong></td>
                      <td><span className={`badge badge-${p.status === 'active' ? 'info' : 'success'}`}><span className="badge-dot" />{p.status}</span></td>
                      <td style={{ fontWeight: 700, color: p.compliance_score >= 80 ? '#10b981' : p.compliance_score >= 60 ? '#f59e0b' : '#ef4444' }}>{p.compliance_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Supervisors Tab */}
      {activeTab === 'supervisors' && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Assigned Supervisors</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Supervisors linked to placements at this facility are shown here.</p>
          {(host.supervisors || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Users size={36} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No supervisors assigned yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Name</th><th>Position</th><th>Verification</th></tr></thead>
                <tbody>
                  {(host.supervisors || []).map((s: any) => (
                    <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/supervisors/${s.id}`)}>
                      <td><strong>{s.first_name} {s.last_name}</strong></td>
                      <td>{s.position}</td>
                      <td><span className={`badge badge-${s.qualification_status === 'verified' ? 'success' : 'warning'}`}><span className="badge-dot" />{s.qualification_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HostDetailPage;
