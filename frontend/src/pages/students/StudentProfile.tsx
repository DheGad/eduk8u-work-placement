import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2,  XCircle, Clock, FileText, BookOpen, Eye } from 'lucide-react';

const ProgressRing = ({ value, max, size = 100 }: { value: number; max: number; size?: number }) => {
  const pct = Math.min(100, (value / max) * 100);
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 100 ? '#10b981' : pct >= 75 ? '#6366f1' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg className="progress-ring-svg" width={size} height={size}>
        <circle className="progress-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={8} />
        <circle className="progress-ring-fill" cx={size / 2} cy={size / 2} r={r} strokeWidth={8} stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="progress-ring-label">
        <span style={{ fontSize: size * 0.18, fontWeight: 800, color }}>{Math.round(pct)}%</span>
        <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)' }}>{value}/{max}h</span>
      </div>
    </div>
  );
};

import { useQuery } from '@tanstack/react-query';
import { getStudent } from '@/api/endpoints/students';

const typeIcon: Record<string, { icon: React.FC<any>; color: string }> = {
  hours: { icon: Clock, color: '#60a5fa' },
  journal: { icon: BookOpen, color: '#a78bfa' },
  verified: { icon: CheckCircle2, color: '#34d399' },
  signed: { icon: FileText, color: '#34d399' },
  evidence: { icon: FileText, color: '#fbbf24' },
};

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'journal' | 'evidence' | 'compliance' | 'activity'>('overview');

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudent(id!),
    enabled: !!id,
  });

  if (isLoading || !student) {
    return <div className="page-content" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  // Construct UI model from API response
  const activePlacement = (student as any).placements?.[0]; // Get the most recent placement
  
  const s: any = {
    ...student,
    dob: student.created_at || '1998-05-12', // fallback for demo
    course: 'CHC33021 Certificate III in Individual Support',
    enrolment_date: student.created_at,
    hours_completed: activePlacement?.hours_completed || 0,
    hours_required: activePlacement?.hours_required || 120,
    compliance_score: activePlacement?.compliance_score || 0,
    placement: activePlacement ? {
      id: activePlacement.id,
      ref: activePlacement.placement_ref,
      host: activePlacement.facility_name,
      supervisor: activePlacement.supervisor_name,
      phase: activePlacement.current_phase
    } : null,
    journal: ((student as any).journals || []).map((j: any) => ({
      date: j.entry_date,
      title: 'Journal Entry',
      summary: j.content
    })),
    evidence: ((student as any).evidence || []).map((e: any) => ({
      name: e.document_name,
      type: e.document_type,
      status: e.status,
      date: e.created_at
    })),
    activity: [], // For demo purposes, leaving activity empty or we can map from logs
    compliance_items: [] // Compliance items usually loaded from placement endpoint, simplifying here
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'journal', label: 'Journal' },
    { key: 'evidence', label: 'Evidence' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'activity', label: 'Activity Timeline' },
  ];

  return (
    <div className="page-content">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }} onClick={() => navigate('/students')}>
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0 }}>
              {s.first_name[0]}{s.last_name[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-primary-400)', fontWeight: 600 }}>{s.student_number}</span>
                <span className="badge badge-info"><span className="badge-dot" />Active</span>
                <span className="badge badge-warning"><span className="badge-dot" />Low Risk</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{s.first_name} {s.last_name}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.course}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => s.placement?.id && navigate(`/placements/${s.placement.id}`)}>
              <Eye size={16} /> View Placement
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <ProgressRing value={s.hours_completed} max={s.hours_required} size={72} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Hours</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{s.hours_completed}<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/{s.hours_required}</span></div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Compliance</div>
            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#34d399' }}>{s.compliance_score}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Phase</div>
            <div style={{ fontWeight: 600 }}>{s.placement?.phase || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Host Facility</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.placement?.host || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Supervisor</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.placement?.supervisor || '—'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{ padding: '0.625rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid var(--color-primary-500)' : '2px solid transparent', color: activeTab === t.key ? 'var(--color-primary-400)' : 'var(--text-muted)', fontWeight: activeTab === t.key ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Personal Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
              {[
                ['Full Name', `${s.first_name} ${s.last_name}`],
                ['Date of Birth', new Date(s.dob).toLocaleDateString('en-AU')],
                ['Email', s.email],
                ['Phone', s.phone],
                ['Address', s.address],
                ['Emergency Contact', `${s.emergency_contact} (${s.emergency_phone})`],
                ['Enrolment Date', new Date(s.enrolment_date).toLocaleDateString('en-AU')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 160 }}>{k}:</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Compliance Quick View</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {s.compliance_items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.8125rem' }}>
                  {item.done ? <CheckCircle2 size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                  <span style={{ color: item.done ? 'var(--text-secondary)' : '#f87171', flex: 1 }}>{item.label}</span>
                  {!item.done && item.note && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.note}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Journal */}
      {activeTab === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {s.journal.map((entry, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontWeight: 700 }}>{entry.title}</h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{new Date(entry.date).toLocaleDateString('en-AU')}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{entry.summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Evidence */}
      {activeTab === 'evidence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {s.evidence.map((doc, i) => (
            <div key={i} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={20} style={{ color: 'var(--color-primary-400)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{doc.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.type} · {new Date(doc.date).toLocaleDateString('en-AU')}</div>
              </div>
              <span className={`badge ${doc.status === 'verified' || doc.status === 'approved' || doc.status === 'signed' ? 'badge-success' : 'badge-warning'}`}><span className="badge-dot" />{doc.status}</span>
              <button className="btn btn-secondary btn-sm">View</button>
            </div>
          ))}
        </div>
      )}

      {/* Compliance */}
      {activeTab === 'compliance' && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>ASQA Audit Compliance Checklist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {s.compliance_items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem', borderRadius: '0.5rem', background: item.done ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${item.done ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                {item.done ? <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} /> : <XCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: item.done ? 'var(--text-primary)' : '#f87171' }}>{item.label}</div>
                  {!item.done && item.note && <div style={{ fontSize: '0.75rem', color: '#f87171', opacity: 0.8, marginTop: 2 }}>{item.note}</div>}
                </div>
                {!item.done && <button className="btn btn-primary btn-sm">Action</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {activeTab === 'activity' && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Activity Timeline</h3>
          <div>
            {s.activity.map((a, i) => {
              const { icon: Icon, color } = typeIcon[a.type] || { icon: Clock, color: 'var(--text-muted)' };
              return (
                <div key={i} style={{ display: 'flex', gap: '1rem', paddingBottom: '1.25rem', position: 'relative' }}>
                  {i < s.activity.length - 1 && <div style={{ position: 'absolute', left: 14, top: 28, bottom: 0, width: 2, background: 'var(--surface-border)' }} />}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.action}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{a.detail}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{new Date(a.date).toLocaleDateString('en-AU')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
