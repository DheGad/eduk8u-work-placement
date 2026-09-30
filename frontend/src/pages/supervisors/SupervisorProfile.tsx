import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, Briefcase, Users, CheckCircle2, XCircle, ShieldCheck, Award, Phone, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

async function fetchSupervisor(id: string) {
  const { data } = await apiClient.get(`/supervisors/${id}`);
  return data.data;
}

const FieldRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '0.5rem', padding: '0.625rem 0', borderBottom: '1px solid var(--surface-border)' }}>
    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>{value || '—'}</span>
  </div>
);

export const SupervisorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');

  const { data: supervisor, isLoading } = useQuery({
    queryKey: ['supervisor', id],
    queryFn: () => fetchSupervisor(id!),
    enabled: !!id,
  });

  const verifyMutation = useMutation({
    mutationFn: () => apiClient.patch(`/supervisors/${id}/verify`, { verification_notes: 'Manually verified by admin', verified: true }),
    onSuccess: () => { toast.success('Supervisor verified successfully'); qc.invalidateQueries({ queryKey: ['supervisor', id] }); },
    onError: () => toast.error('Failed to verify supervisor'),
  });

  if (isLoading || !supervisor) return (
    <div className="page-content" style={{ textAlign: 'center', padding: '4rem' }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading supervisor profile…</p>
    </div>
  );

  const isVerified = supervisor.qualification_status === 'verified';
  const initials = `${supervisor.first_name?.[0] || ''}${supervisor.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="page-content">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate('/supervisors')}>
        <ArrowLeft size={16} /> Back to Supervisors
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{initials}</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 4 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{supervisor.first_name} {supervisor.last_name}</h1>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: isVerified ? '#10b981' : '#f59e0b', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isVerified ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {isVerified ? 'CA 0395 Verified' : 'Pending Verification'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{supervisor.position} {supervisor.host_name ? `· ${supervisor.host_name}` : ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!isVerified && (
              <button className="btn btn-success" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}>
                <ShieldCheck size={16} /> Verify Supervisor (CA 0395)
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
          {[
            { label: 'Qualification Status', value: supervisor.qualification_status?.replace(/_/g, ' ') || '—' },
            { label: 'Assigned Students', value: supervisor.student_count || 0 },
            { label: 'Host Facility', value: supervisor.host_name || '—' },
            { label: 'RTO Experience', value: supervisor.years_experience ? `${supervisor.years_experience} yrs` : '—' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem' }}>
        {['overview', 'students'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} style={{ padding: '0.625rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === t ? '2px solid var(--color-primary-500)' : '2px solid transparent', color: activeTab === t ? 'var(--color-primary-400)' : 'var(--text-muted)', fontWeight: activeTab === t ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem', marginBottom: -1, textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Contact Information</h3>
            <FieldRow label="Email" value={supervisor.email} />
            <FieldRow label="Phone" value={supervisor.phone} />
            <FieldRow label="Position" value={supervisor.position} />
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Qualifications (CA 0395)</h3>
            <FieldRow label="Highest Qualification" value={supervisor.qualification_level} />
            <FieldRow label="Field of Study" value={supervisor.qualification_field} />
            <FieldRow label="RTO Experience (yrs)" value={supervisor.years_experience} />
            <FieldRow label="NDIS Screening" value={supervisor.ndis_screening_number} />
            {supervisor.verified_at && <FieldRow label="Verified On" value={new Date(supervisor.verified_at).toLocaleDateString('en-AU')} />}
            {supervisor.verification_notes && <FieldRow label="Notes" value={supervisor.verification_notes} />}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Assigned Students</h3>
          {!(supervisor.placements?.length) ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No students currently assigned to this supervisor.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Student</th><th>Placement Ref</th><th>Hours</th><th>Compliance</th></tr></thead>
                <tbody>
                  {(supervisor.placements || []).map((p: any) => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/placements/${p.id}`)}>
                      <td><strong>{p.student_name}</strong></td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary-400)' }}>{p.placement_ref}</span></td>
                      <td>{p.hours_completed}/{p.hours_required}h</td>
                      <td style={{ fontWeight: 700, color: p.compliance_score >= 80 ? '#10b981' : p.compliance_score >= 60 ? '#f59e0b' : '#ef4444' }}>{p.compliance_score}%</td>
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

export default SupervisorProfile;
