import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, XCircle,
  FileText, User, Building, UserCheck, Upload, Plus,
  ChevronRight, Pen, TrendingUp, Activity
} from 'lucide-react';

// --- 120-hour Progress Ring ---
const ProgressRing = ({ value, max, size = 120 }: { value: number; max: number; size?: number }) => {
  const pct = Math.min(100, (value / max) * 100);
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 100 ? '#10b981' : pct >= 75 ? '#6366f1' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg className="progress-ring-svg" width={size} height={size}>
        <circle className="progress-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={8} />
        <circle
          className="progress-ring-fill"
          cx={size / 2} cy={size / 2} r={r} strokeWidth={8}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="progress-ring-label">
        <span style={{ fontSize: size * 0.18, fontWeight: 800, color }}>{Math.round(pct)}%</span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)' }}>{value}/{max}h</span>
      </div>
    </div>
  );
};

// --- Phase Timeline ---
const PHASES = [
  { key: 'host_setup', label: 'Host Setup', desc: 'CA 0393 Suitability + Insurance' },
  { key: 'supervisor_verified', label: 'Supervisor Verified', desc: 'CA 0395 Qualification + Briefing' },
  { key: 'student_ready', label: 'Student Ready', desc: 'CA 0398 Pre-Placement Readiness' },
  { key: 'agreement', label: 'Agreement Signed', desc: 'CA 0355 Tripartite Agreement' },
  { key: 'active', label: 'Hours Logging', desc: 'LR 0353 Daily Hour Log' },
  { key: 'monitoring', label: 'Monitoring', desc: 'Trainer visits & competency checks' },
  { key: 'evidence', label: 'Evidence Uploaded', desc: 'Photos, certificates, documents' },
  { key: 'final_signoff', label: 'Final Sign-Off', desc: 'Supervisor & student sign completion' },
  { key: 'completed', label: 'Completed', desc: 'Audit-ready package generated' },
];

// MOCK_DETAIL removed

const docStatusConfig: Record<string, { cls: string; label: string }> = {
  signed: { cls: 'badge-success', label: 'Signed' },
  approved: { cls: 'badge-success', label: 'Approved' },
  verified: { cls: 'badge-success', label: 'Verified' },
  acknowledged: { cls: 'badge-info', label: 'Acknowledged' },
  pending: { cls: 'badge-warning', label: 'Pending' },
  rejected: { cls: 'badge-danger', label: 'Rejected' },
};

// --- Log Hours Modal ---
const LogHoursModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ date: '', time_in: '', time_out: '', activities: '', learning_outcomes: '' });
  if (!open) return null;
  const hrs = form.time_in && form.time_out
    ? Math.max(0, ((new Date(`2000-01-01T${form.time_out}`) as any) - (new Date(`2000-01-01T${form.time_in}`) as any)) / 3600000)
    : 0;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Log Placement Hours</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><XCircle size={18} /></button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Date *</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Time In *</label>
              <input className="input" type="time" value={form.time_in} onChange={e => setForm(f => ({ ...f, time_in: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Time Out *</label>
              <input className="input" type="time" value={form.time_out} onChange={e => setForm(f => ({ ...f, time_out: e.target.value }))} />
            </div>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ padding: '0.5rem 0.875rem', background: 'rgba(99,102,241,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a5b4fc' }}>{hrs.toFixed(1)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>hours calculated</div>
              </div>
            </div>
            <div className="input-group" style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Activities Performed *</label>
              <textarea className="textarea" rows={3} placeholder="Describe the care activities performed during this shift…" value={form.activities} onChange={e => setForm(f => ({ ...f, activities: e.target.value }))} />
            </div>
            <div className="input-group" style={{ gridColumn: '1/-1' }}>
              <label className="input-label">Learning Outcomes</label>
              <textarea className="textarea" rows={2} placeholder="What did you learn today?" value={form.learning_outcomes} onChange={e => setForm(f => ({ ...f, learning_outcomes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { alert(`${hrs.toFixed(1)} hours logged for ${form.date}. Awaiting supervisor approval.`); onClose(); }}>
              <Plus size={16} /> Submit Hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useQuery } from '@tanstack/react-query';
import { getPlacement, getPlacementHours, getPlacementEvidence } from '@/api/endpoints/placements';
import apiClient from '@/api/client';

export const PlacementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'hours' | 'documents' | 'compliance' | 'monitoring'>('overview');
  const [showLogHours, setShowLogHours] = useState(false);
  
  const { data: placement, isLoading: pLoading } = useQuery({
    queryKey: ['placement', id],
    queryFn: () => getPlacement(id!),
    enabled: !!id,
  });

  const { data: hours = [] } = useQuery({
    queryKey: ['placement', id, 'hours'],
    queryFn: () => getPlacementHours(id!),
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['placement', id, 'evidence'],
    queryFn: () => getPlacementEvidence(id!),
    enabled: !!id,
  });

  const { data: complianceObj } = useQuery({
    queryKey: ['placement', id, 'compliance'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/placements/${id}/compliance`);
      return data.data;
    },
    enabled: !!id,
  });

  if (pLoading || !placement) {
    return <div className="page-content" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  // Construct view model from API data
  const p = {
    ...placement,
    completed_phases: placement.host_approved && placement.supervisor_verified ? ['host_setup', 'supervisor_verified'] : [],
    hours_log: hours.map(h => ({
      date: h.log_date,
      hours: h.hours_claimed,
      status: h.status,
      activities: h.activities,
    })),
    documents: documents.map(d => ({
      name: d.document_name,
      type: d.document_type || d.form_code,
      status: d.status,
      date: d.created_at,
    })),
    compliance_items: complianceObj?.items || [],
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'hours', label: `Hours (${p.hours_completed}/${p.hours_required})` },
    { key: 'documents', label: 'Documents' },
    { key: 'monitoring', label: 'Monitoring' },
    { key: 'compliance', label: 'Compliance' },
  ];

  const completedPhaseCount = p.completed_phases.length;
  const currentPhaseIdx = PHASES.findIndex(ph => ph.key === p.current_phase);

  return (
    <div className="page-content">
      <LogHoursModal open={showLogHours} onClose={() => setShowLogHours(false)} />

      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate('/placements')}>
        <ArrowLeft size={16} /> Back to Placements
      </button>

      {/* Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'monospace', color: 'var(--color-primary-400)', fontWeight: 700, fontSize: '0.875rem' }}>{p.placement_ref}</span>
              <span className="badge badge-info"><span className="badge-dot" />Active</span>
              {p.compliance_score >= 80 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy (Green)
                </span>
              ) : p.compliance_score >= 60 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  <Activity className="w-3 h-3 mr-1" /> At Risk (Amber)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Critical (Red)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {p.student.first_name} {p.student.last_name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {p.host.facility_name} · {p.host.suburb}, {p.host.state}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={async () => {
              try {
                const res = await apiClient.get(`/audit/pack/${id}`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Audit_Pack_${p.placement_ref}.pdf`);
                document.body.appendChild(link);
                link.click();
              } catch (e) {
                alert('Failed to generate audit pack');
              }
            }}>
              <FileText size={16} /> Audit Pack (PDF)
            </button>
            <button className="btn btn-primary" onClick={() => setShowLogHours(true)}>
              <Plus size={16} /> Log Hours
            </button>
          </div>
        </div>

        {/* 3-col summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ProgressRing value={p.hours_completed} max={p.hours_required} size={80} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hours Progress</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{p.hours_completed}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{p.hours_required}</span></div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Compliance Score</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{p.compliance_score}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit ready</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Timeline</div>
            <div style={{ fontSize: '0.875rem' }}>
              <div>Started: <strong>{new Date(p.start_date).toLocaleDateString('en-AU')}</strong></div>
              <div>Due: <strong>{new Date(p.end_date).toLocaleDateString('en-AU')}</strong></div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Supervisor</div>
            <div style={{ fontWeight: 600 }}>{p.supervisor.first_name} {p.supervisor.last_name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{p.supervisor.position}</div>
            <span className="badge badge-success" style={{ marginTop: 4 }}><span className="badge-dot" />Verified</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              padding: '0.625rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--color-primary-500)' : '2px solid transparent',
              color: activeTab === t.key ? 'var(--color-primary-400)' : 'var(--text-muted)',
              fontWeight: activeTab === t.key ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Phase Timeline */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 700 }}>Placement Phases</h3>
            <div style={{ position: 'relative' }}>
              {PHASES.map((phase, i) => {
                const done = p.completed_phases.includes(phase.key);
                const current = phase.key === p.current_phase;
                return (
                  <div key={phase.key} style={{ display: 'flex', gap: '0.875rem', paddingBottom: '1.25rem', position: 'relative' }}>
                    {i < PHASES.length - 1 && (
                      <div style={{ position: 'absolute', left: 14, top: 28, bottom: 0, width: 2, background: done ? 'var(--color-primary-500)' : 'var(--surface-border)' }} />
                    )}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? 'var(--color-primary-600)' : current ? 'rgba(99,102,241,0.15)' : 'var(--surface-border)',
                      border: current ? '2px solid var(--color-primary-500)' : 'none',
                    }}>
                      {done ? <CheckCircle2 size={16} color="#fff" /> : current ? <Clock size={14} color="var(--color-primary-400)" /> : null}
                    </div>
                    <div>
                      <div style={{ fontWeight: current || done ? 600 : 400, color: done ? 'var(--text-primary)' : current ? 'var(--color-primary-300)' : 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {phase.label}
                        {current && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--color-primary-400)', fontWeight: 400 }}>← Current</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{phase.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Parties */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} style={{ color: 'var(--color-primary-400)' }} /> Student
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Name:</span><br /><strong>{p.student.first_name} {p.student.last_name}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Student No:</span><br /><strong>{p.student.student_number}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email:</span><br /><strong>{p.student.email}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span><br /><strong>{p.student.phone}</strong></div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building size={18} style={{ color: '#34d399' }} /> Host Facility
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'var(--text-muted)' }}>Facility:</span><br /><strong>{p.host.facility_name}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Location:</span><br /><strong>{p.host.suburb}, {p.host.state}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Contact:</span><br /><strong>{p.host.contact}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Hours */}
      {activeTab === 'hours' && (
        <div>
          {/* Milestones */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[25, 50, 75, 90, 100].map(m => {
              const done = (p.hours_completed / p.hours_required) * 100 >= m;
              return (
                <div key={m} className="card" style={{ textAlign: 'center', padding: '1rem', border: `1px solid ${done ? 'rgba(99,102,241,0.4)' : 'var(--surface-border)'}`, background: done ? 'rgba(99,102,241,0.06)' : undefined }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{done ? '🎯' : '⏳'}</div>
                  <div style={{ fontWeight: 700, color: done ? 'var(--color-primary-300)' : 'var(--text-muted)' }}>{m}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(p.hours_required * m / 100)}h</div>
                </div>
              );
            })}
          </div>

          {/* Log button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowLogHours(true)}><Plus size={16} /> Log Hours</button>
          </div>

          {/* Hours table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Activities</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {p.hours_log.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.date).toLocaleDateString('en-AU')}</td>
                    <td><strong>{h.hours}h</strong></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: 300 }}>{h.activities}</td>
                    <td>
                      <span className={`badge ${h.status === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                        <span className="badge-dot" />
                        {h.status === 'verified' ? 'Verified' : 'Pending Approval'}
                      </span>
                    </td>
                    <td>
                      {h.status === 'pending' && <button className="btn btn-success btn-sm">Approve</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary"><Upload size={16} /> Upload Document</button>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {p.documents.map((doc, i) => (
              <div key={i} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} style={{ color: 'var(--color-primary-400)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{doc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Form: {doc.type} · {new Date(doc.date).toLocaleDateString('en-AU')}</div>
                </div>
                <span className={`badge ${docStatusConfig[doc.status]?.cls || 'badge-neutral'}`}>
                  <span className="badge-dot" />
                  {docStatusConfig[doc.status]?.label || doc.status}
                </span>
                <button className="btn btn-secondary btn-sm">View</button>
                <button className="btn btn-secondary btn-sm">Download</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Compliance */}
      {activeTab === 'compliance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontWeight: 700 }}>ASQA Audit Checklist</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{p.compliance_score}%</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {p.compliance_items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', background: item.done ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${item.done ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      {item.done
                        ? <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                        : <XCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                      }
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: item.done ? 'var(--text-primary)' : '#f87171' }}>{item.label}</div>
                        {!item.done && item.note && <div style={{ fontSize: '0.75rem', color: '#f87171', opacity: 0.8 }}>{item.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Missing Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {p.compliance_items.filter(i => !i.done).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={16} color="#ef4444" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</div>
                      {item.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.note}</div>}
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>Fix</button>
                  </div>
                ))}
                {p.compliance_items.filter(i => !i.done).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
                    <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ fontWeight: 600 }}>All checks passed!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab: Monitoring */}
      {activeTab === 'monitoring' && (
        <MonitoringTab placementId={id!} />
      )}
    </div>
  );
};

const MonitoringTab = ({ placementId }: { placementId: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ visit_date: '', visit_type: 'in_person', findings: '', issues_identified: '', follow_up_actions: '' });

  const { data: visits = [], isLoading, refetch } = useQuery({
    queryKey: ['placement', placementId, 'monitoring'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/placements/${placementId}/monitoring`);
      return data.data || data;
    }
  });

  const submitVisit = async () => {
    if (!form.visit_date) return alert('Date is required');
    await apiClient.post(`/placements/${placementId}/monitoring`, form);
    setShowModal(false);
    refetch();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Record Visit
        </button>
      </div>
      
      {isLoading ? <p>Loading...</p> : visits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No monitoring visits recorded yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {visits.map((v: any) => (
            <div key={v.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontWeight: 700 }}>{new Date(v.visit_date).toLocaleDateString()} - {v.visit_type}</h4>
                <span className="badge badge-info">{v.conducted_by_name}</span>
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <strong>Findings:</strong> {v.findings || 'N/A'}
              </div>
              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: v.issues_identified ? '#ef4444' : 'inherit' }}>
                <strong>Issues:</strong> {v.issues_identified || 'None'}
              </div>
              {v.follow_up_actions && (
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>Follow-up:</strong> {v.follow_up_actions}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Record Monitoring Visit</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><XCircle size={18} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Date *</label>
                <input className="input" type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="input" value={form.visit_type} onChange={e => setForm(f => ({ ...f, visit_type: e.target.value }))}>
                  <option value="in_person">In Person</option>
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Findings</label>
                <textarea className="textarea" rows={3} value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Issues Identified</label>
                <textarea className="textarea" rows={2} value={form.issues_identified} onChange={e => setForm(f => ({ ...f, issues_identified: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Follow-up Actions</label>
                <textarea className="textarea" rows={2} value={form.follow_up_actions} onChange={e => setForm(f => ({ ...f, follow_up_actions: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={submitVisit}>Save Visit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementDetail;
