import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, AlertTriangle, TrendingUp, Users, Activity,
  CheckCircle2, XCircle, MapPin, BookOpen, Clock, FileText, ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export const ComplianceDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch Scores
  const { data: scoresObj } = useQuery({
    queryKey: ['intelligence', 'scores'],
    queryFn: async () => {
      const { data } = await apiClient.get('/intelligence/scores');
      return data.data;
    }
  });

  // Fetch Missing Compliance
  const { data: missingObj } = useQuery({
    queryKey: ['intelligence', 'missing'],
    queryFn: async () => {
      const { data } = await apiClient.get('/intelligence/missing-compliance');
      return data.data;
    }
  });

  // Fetch Heatmaps
  const { data: heatmapsObj } = useQuery({
    queryKey: ['intelligence', 'heatmaps'],
    queryFn: async () => {
      const { data } = await apiClient.get('/intelligence/heatmaps');
      return data.data;
    }
  });

  // Fetch Recommendations
  const { data: recsObj } = useQuery({
    queryKey: ['intelligence', 'recommendations'],
    queryFn: async () => {
      const { data } = await apiClient.get('/intelligence/recommendations');
      return data.data;
    }
  });

  const scores = scoresObj || { audit_readiness: 0, compliance_health: 0, risk_score: 0, placement_health: 0 };
  const missing = missingObj || { missing_evidence: [], missing_signatures: [], missing_journals: [], missing_reviews: [] };
  const heatmaps = heatmapsObj || { campuses: [], courses: [], cohorts: [] };
  const recs = recsObj?.recommendations || [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Compliance Engine</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>Real-time audit readiness, risk detection, and automated compliance actions.</p>
        </div>
      </div>

      {/* Top Scores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <ScoreCard title="Audit Readiness" value={scores.audit_readiness} suffix="%" icon={ShieldCheck} type="success" />
        <ScoreCard title="Compliance Health" value={scores.compliance_health} suffix="%" icon={Activity} type="info" />
        <ScoreCard title="Student Risk" value={scores.risk_score} suffix="%" icon={AlertTriangle} type="danger" invert />
        <ScoreCard title="Placement Health" value={scores.placement_health} suffix="%" icon={TrendingUp} type="success" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Heatmaps Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Heatmaps */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.125rem' }}>Compliance Heatmaps</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} /> By Campus</h4>
                {heatmaps.campuses.length === 0 ? <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No data</p> : heatmaps.campuses.map((c: any) => (
                  <HeatmapBar key={c.campus} label={c.campus || 'Online'} value={Math.round(c.avg_compliance)} />
                ))}
              </div>
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}><BookOpen size={14} style={{ display: 'inline', marginRight: 4 }} /> By Course</h4>
                {heatmaps.courses.length === 0 ? <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No data</p> : heatmaps.courses.map((c: any) => (
                  <HeatmapBar key={c.course} label={c.course} value={Math.round(c.avg_compliance)} />
                ))}
              </div>
            </div>
          </div>

          {/* Missing Compliance Detection */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.125rem' }}>Missing Compliance Detection</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <MissingBlock title="Missing Signatures" items={missing.missing_signatures} />
              <MissingBlock title="Missing Evidence" items={missing.missing_evidence} />
              <MissingBlock title="Missing Journals" items={missing.missing_journals} />
              <MissingBlock title="Missing Supervisor Reviews" items={missing.missing_reviews} />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Recommended Actions */}
          <div className="card" style={{ border: '1px solid var(--color-primary-500)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.125rem', color: 'var(--color-primary-400)' }}>Recommended Actions</h3>
            {recs.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>All clear! No pending actions.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recs.map((r: string, i: number) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: '0.5rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <ChevronRight size={16} color="var(--color-primary-400)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.125rem' }}>Audit Automation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/compliance/reports')}>
                <FileText size={16} /> Campus Risk Report
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/compliance/reports')}>
                <FileText size={16} /> Course Risk Report
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/compliance/reports')}>
                <Users size={16} /> Host Performance Report
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

// --- Components ---

const ScoreCard = ({ title, value, suffix, icon: Icon, type, invert = false }: any) => {
  let color = 'var(--color-primary-400)';
  if (type === 'success') color = '#10b981';
  if (type === 'danger') color = '#ef4444';
  if (type === 'warning') color = '#f59e0b';

  // For risk scores, higher is worse
  if (invert) {
    if (value > 20) color = '#ef4444';
    else if (value > 5) color = '#f59e0b';
    else color = '#10b981';
  } else {
    if (value < 60) color = '#ef4444';
    else if (value < 80) color = '#f59e0b';
    else color = '#10b981';
  }

  return (
    <div className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}{suffix}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
};

const HeatmapBar = ({ label, value }: { label: string, value: number }) => {
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface-border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

const MissingBlock = ({ title, items }: { title: string, items: any[] }) => {
  return (
    <div style={{ border: '1px solid var(--surface-border)', borderRadius: '0.5rem', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }}>{title}</h4>
        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 12, background: items?.length > 0 ? '#fee2e2' : '#d1fae5', color: items?.length > 0 ? '#991b1b' : '#065f46', fontWeight: 600 }}>
          {items?.length || 0}
        </span>
      </div>
      {items?.length === 0 ? (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None missing.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items?.slice(0, 3).map((it, i) => (
            <div key={i} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{it.student}</span>
              <a href={`/placements/${it.placement_id}`} style={{ color: 'var(--color-primary-400)', fontWeight: 600 }}>{it.ref}</a>
            </div>
          ))}
          {items?.length > 3 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              + {items.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ComplianceDashboard;
