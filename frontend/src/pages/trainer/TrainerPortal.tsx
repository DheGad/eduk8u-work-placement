import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Upload,
  FileText,
  Phone,
  Video,
  User,
  X,
  Loader2,
  TrendingUp,
  Eye,
  AlertCircle,
  Activity,
  Calendar,
  Plus,
  ChevronRight,
  Bell,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { listPlacements, getPlacementJournal, getPlacementEvidence } from '@/api/endpoints/placements';
import apiClient from '@/api/client';
import type {
  Placement,
  
  PlacementJournal,
  RiskFlag,
  RiskLevel,
  ApiResponse,
} from '@/types';

/* =========================================
   HELPERS
   ========================================= */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function riskColor(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    none: '#10b981',
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };
  return map[risk] ?? '#6b7280';
}

function riskBg(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    none: 'rgba(16,185,129,0.08)',
    low: 'rgba(59,130,246,0.08)',
    medium: 'rgba(245,158,11,0.08)',
    high: 'rgba(239,68,68,0.08)',
    critical: 'rgba(220,38,38,0.12)',
  };
  return map[risk] ?? 'rgba(107,114,128,0.08)';
}

/* =========================================
   MINI PROGRESS BAR
   ========================================= */

const ProgressBar: React.FC<{ pct: number }> = ({ pct }) => {
  const color =
    pct >= 0.9
      ? '#10b981'
      : pct >= 0.6
        ? '#6366f1'
        : pct >= 0.3
          ? '#f59e0b'
          : '#ef4444';
  return (
    <div
      style={{
        position: 'relative',
        height: 6,
        borderRadius: 3,
        background: 'var(--surface-border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.min(pct * 100, 100)}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
};

/* =========================================
   SKELETON
   ========================================= */

const Skeleton: React.FC<{ h?: number; w?: string }> = ({ h = 16, w = '100%' }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: 6, marginBottom: 8 }} />
);

/* =========================================
   MONITORING VISIT MODAL
   ========================================= */

interface MonitoringVisitModalProps {
  placement: Placement;
  onClose: () => void;
}

const MonitoringVisitModal: React.FC<MonitoringVisitModalProps> = ({ placement, onClose }) => {
  const [form, setForm] = useState({
    visit_date: today(),
    visit_type: 'phone' as 'phone' | 'in_person' | 'video',
    progress_rating: 3,
    issues_identified: '',
    actions_required: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiClient
        .post<ApiResponse<unknown>>(`/placements/${placement.id}/monitoring-visits`, form)
        .then((r) => r.data.data),
    onSuccess: () => {
      toast.success('Monitoring visit logged!');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const VisitTypeButton = ({
    type,
    icon,
    label,
  }: {
    type: typeof form.visit_type;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={() => setForm((f) => ({ ...f, visit_type: type }))}
      style={{
        flex: 1,
        padding: '0.75rem 0.5rem',
        borderRadius: 'var(--radius-lg)',
        border: `2px solid ${form.visit_type === type ? '#6366f1' : 'var(--surface-border)'}`,
        background: form.visit_type === type ? 'rgba(99,102,241,0.12)' : 'var(--surface-input)',
        color: form.visit_type === type ? '#818cf8' : 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.375rem',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: 600,
        transition: 'all var(--transition-fast)',
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Activity size={18} style={{ display: 'inline', marginRight: '0.5rem', color: '#6366f1' }} />
            Log Monitoring Visit — {placement.student?.user?.full_name}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Visit Date</label>
            <input
              className="input"
              type="date"
              value={form.visit_date}
              onChange={(e) => setForm((f) => ({ ...f, visit_date: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Visit Type</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <VisitTypeButton type="phone" icon={<Phone size={20} />} label="Phone" />
              <VisitTypeButton type="in_person" icon={<User size={20} />} label="In Person" />
              <VisitTypeButton type="video" icon={<Video size={20} />} label="Video Call" />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Student Progress Rating (1–5)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, progress_rating: n }))}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${form.progress_rating === n ? '#6366f1' : 'var(--surface-border)'}`,
                    background: form.progress_rating === n ? 'rgba(99,102,241,0.15)' : 'var(--surface-input)',
                    color: form.progress_rating === n ? '#818cf8' : 'var(--text-muted)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {n}
                </button>
              ))}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                {['', 'At Risk', 'Below Expectations', 'Meets Expectations', 'Above Expectations', 'Excellent'][form.progress_rating]}
              </span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Issues Identified</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Any concerns, issues, or risks identified during this visit..."
              value={form.issues_identified}
              onChange={(e) => setForm((f) => ({ ...f, issues_identified: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Actions Required</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="What actions need to be taken? By whom? By when?"
              value={form.actions_required}
              onChange={(e) => setForm((f) => ({ ...f, actions_required: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Additional Notes</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Any other observations..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Activity size={14} />
            )}
            Log Visit
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   RISK FLAG CARD
   ========================================= */

interface RiskFlagCardProps {
  flag: RiskFlag;
  placementId: string;
}

const RiskFlagCard: React.FC<RiskFlagCardProps> = ({ flag, placementId }) => {
  const qc = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: (notes: string) =>
      apiClient
        .patch<ApiResponse<RiskFlag>>(`/placements/${placementId}/risk-flags/${flag.id}/resolve`, {
          resolution_notes: notes,
        })
        .then((r) => r.data.data),
    onSuccess: () => {
      toast.success('Risk flag resolved');
      qc.invalidateQueries({ queryKey: ['trainer-risk-flags'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: () =>
      apiClient
        .patch<ApiResponse<RiskFlag>>(`/placements/${placementId}/risk-flags/${flag.id}/acknowledge`, {})
        .then((r) => r.data.data),
    onSuccess: () => {
      toast.success('Flag acknowledged');
      qc.invalidateQueries({ queryKey: ['trainer-risk-flags'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const color = riskColor(flag.severity);
  const bg = riskBg(flag.severity);

  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-xl)',
        background: bg,
        border: `1px solid ${color}30`,
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={18} style={{ color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{flag.title}</span>
          <span
            className="badge"
            style={{
              background: `${color}15`,
              color,
              border: `1px solid ${color}30`,
              fontSize: '0.65rem',
              textTransform: 'uppercase',
            }}
          >
            {flag.severity}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {formatRelative(flag.created_at)}
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.375rem', lineHeight: 1.5 }}>
          {flag.description}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={acknowledgeMutation.isPending}
            onClick={() => acknowledgeMutation.mutate()}
          >
            <Bell size={12} /> Acknowledge
          </button>
          <button
            className="btn btn-success btn-sm"
            disabled={resolveMutation.isPending}
            onClick={() => {
              const notes = prompt('Resolution notes:');
              if (notes !== null) resolveMutation.mutate(notes);
            }}
          >
            {resolveMutation.isPending ? (
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <CheckCircle size={12} />
            )}
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   STUDENT STATUS CARD
   ========================================= */

interface StudentStatusCardProps {
  placement: Placement;
  onLogVisit: (p: Placement) => void;
}

const StudentStatusCard: React.FC<StudentStatusCardProps> = ({ placement, onLogVisit }) => {
  const pct =
    placement.total_hours_required > 0
      ? placement.total_hours_verified / placement.total_hours_required
      : 0;

  const statusColor: Record<string, string> = {
    active: '#10b981',
    at_risk: '#ef4444',
    suspended: '#f87171',
    completed: '#3b82f6',
    pending: '#f59e0b',
    approved: '#6366f1',
    cancelled: '#6b7280',
  };

  const cardBorder =
    placement.status === 'at_risk' || placement.risk_level === 'high' || placement.risk_level === 'critical'
      ? '1px solid rgba(239,68,68,0.3)'
      : placement.status === 'active' && pct < 0.3 && placement.total_hours_logged > 0
        ? '1px solid rgba(245,158,11,0.3)'
        : '1px solid var(--surface-border)';

  return (
    <div
      className="card"
      style={{ border: cardBorder, cursor: 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `${statusColor[placement.status] ?? '#6b7280'}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: statusColor[placement.status] ?? '#6b7280',
          }}
        >
          {(placement.student?.user?.first_name?.[0] ?? '?')}
          {(placement.student?.user?.last_name?.[0] ?? '')}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {placement.student?.user?.full_name ?? 'Student'}
            </span>
            <span
              className="badge"
              style={{
                background: `${statusColor[placement.status] ?? '#6b7280'}15`,
                color: statusColor[placement.status] ?? '#6b7280',
                border: `1px solid ${statusColor[placement.status] ?? '#6b7280'}30`,
                fontSize: '0.65rem',
              }}
            >
              {placement.status.replace('_', ' ')}
            </span>
            {(placement.risk_level === 'high' || placement.risk_level === 'critical') && (
              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                <AlertTriangle size={10} /> {placement.risk_level} risk
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
            {placement.student?.course_name ?? '—'} · {placement.host?.facility_name ?? '—'}
          </div>
          <div style={{ marginTop: '0.625rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '0.25rem',
              }}
            >
              <span>Hours Progress</span>
              <span style={{ fontWeight: 600 }}>
                {placement.total_hours_verified.toFixed(0)} / {placement.total_hours_required}h verified
              </span>
            </div>
            <ProgressBar pct={pct} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm">
          <Eye size={12} /> View
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => onLogVisit(placement)}>
          <Activity size={12} /> Log Visit
        </button>
      </div>
    </div>
  );
};

/* =========================================
   MAIN PAGE
   ========================================= */

/**
 * TrainerPortal — Trainer monitoring dashboard for tracking student progress,
 * reviewing risk flags, logging monitoring visits, and reviewing evidence/journals.
 */
const TrainerPortal: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [visitModalPlacement, setVisitModalPlacement] = useState<Placement | null>(null);

  // Fetch all placements assigned to this trainer
  const { data: placementsData, isLoading: placementsLoading } = useQuery({
    queryKey: ['trainer-placements'],
    queryFn: () => listPlacements({ trainer_id: user?.id, limit: 100 }),
    enabled: !!user,
  });

  const placements = placementsData?.data ?? [];

  // Aggregate risk flags across all placements
  const { data: allFlags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ['trainer-risk-flags'],
    queryFn: async () => {
      const results = await Promise.all(
        placements
          .filter((p) => p.risk_level !== 'none')
          .map((p) =>
            apiClient
              .get<ApiResponse<RiskFlag[]>>(`/placements/${p.id}/risk-flags`)
              .then((r) =>
                r.data.data
                  .filter((f) => !f.is_resolved)
                  .map((f) => ({ ...f, _placementId: p.id })),
              )
              .catch(() => []),
          ),
      );
      return results.flat().sort((a, b) => {
        const order: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
        return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
      });
    },
    enabled: placements.length > 0,
  });

  // Missing evidence this week
  const { data: missingEvidence = [], isLoading: evidenceLoading } = useQuery({
    queryKey: ['trainer-missing-evidence'],
    queryFn: async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const results = await Promise.all(
        placements
          .filter((p) => p.status === 'active')
          .map(async (p) => {
            try {
              const ev = await getPlacementEvidence(p.id);
              const hasRecentEvidence = ev.some(
                (e: any) => new Date(e.created_at) >= weekAgo,
              );
              return hasRecentEvidence ? null : p;
            } catch {
              return null;
            }
          }),
      );
      return results.filter((p): p is Placement => p !== null);
    },
    enabled: placements.length > 0,
  });

  // Pending journal reviews
  const { data: pendingJournals = [] } = useQuery({
    queryKey: ['trainer-pending-journals'],
    queryFn: async () => {
      const results = await Promise.all(
        placements
          .filter((p) => p.status === 'active')
          .slice(0, 10) // limit API calls
          .map(async (p) => {
            try {
              const j = await getPlacementJournal(p.id);
              const unreviewed = j.filter(
                (entry) =>
                  entry.visibility === 'trainer_visible' || entry.visibility === 'all',
              );
              return unreviewed.map((e) => ({ ...e, _student: p.student, _placementId: p.id }));
            } catch {
              return [];
            }
          }),
      );
      return results
        .flat()
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
        .slice(0, 10);
    },
    enabled: placements.length > 0,
  });

  // Colour coding for student cards
  const atRisk = placements.filter(
    (p) => p.risk_level === 'high' || p.risk_level === 'critical' || p.status === 'at_risk',
  );
  const needsAttention = placements.filter(
    (p) =>
      !atRisk.includes(p) &&
      (p.risk_level === 'medium' ||
        (p.total_hours_required > 0 && p.total_hours_verified / p.total_hours_required < 0.3)),
  );
  const onTrack = placements.filter(
    (p) => !atRisk.includes(p) && !needsAttention.includes(p),
  );

  // Stats
  const criticalFlags = (allFlags as (RiskFlag & { _placementId: string })[]).filter(
    (f) => f.severity === 'critical' || f.severity === 'high',
  ).length;

  if (placementsLoading) {
    return (
      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card">
            <Skeleton h={48} w="48px" />
            <Skeleton h={28} w="60%" />
            <Skeleton h={14} w="40%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {visitModalPlacement && (
        <MonitoringVisitModal
          placement={visitModalPlacement}
          onClose={() => setVisitModalPlacement(null)}
        />
      )}

      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Trainer Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Welcome back, {user?.first_name ?? 'Trainer'} · {placements.length} students assigned
          </p>
        </div>

        {/* ── Stats ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          {[
            {
              icon: <Users size={22} />,
              value: placements.length,
              label: 'Total Students',
              cls: 'stat-card-primary',
              icls: 'stat-card-icon-primary',
            },
            {
              icon: <TrendingUp size={22} />,
              value: onTrack.length,
              label: 'On Track',
              cls: 'stat-card-success',
              icls: 'stat-card-icon-success',
            },
            {
              icon: <AlertCircle size={22} />,
              value: needsAttention.length,
              label: 'Needs Attention',
              cls: 'stat-card-warning',
              icls: 'stat-card-icon-warning',
            },
            {
              icon: <AlertTriangle size={22} />,
              value: atRisk.length,
              label: 'At Risk',
              cls: 'stat-card-danger',
              icls: 'stat-card-icon-danger',
            },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className={`stat-card-icon ${s.icls}`}>{s.icon}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* ── Student Overview Grid ── */}
            <div className="card">
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                <Users size={18} style={{ color: '#6366f1' }} />
                My Students Overview
              </h2>

              {atRisk.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#f87171',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <AlertTriangle size={12} /> At Risk ({atRisk.length})
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {atRisk.map((p) => (
                      <StudentStatusCard key={p.id} placement={p} onLogVisit={setVisitModalPlacement} />
                    ))}
                  </div>
                </div>
              )}

              {needsAttention.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#fbbf24',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.625rem',
                    }}
                  >
                    Needs Attention ({needsAttention.length})
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {needsAttention.map((p) => (
                      <StudentStatusCard key={p.id} placement={p} onLogVisit={setVisitModalPlacement} />
                    ))}
                  </div>
                </div>
              )}

              {onTrack.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#34d399',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.625rem',
                    }}
                  >
                    On Track ({onTrack.length})
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {onTrack.map((p) => (
                      <StudentStatusCard key={p.id} placement={p} onLogVisit={setVisitModalPlacement} />
                    ))}
                  </div>
                </div>
              )}

              {placements.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Users size={36} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
                  <p>No students assigned to you yet.</p>
                </div>
              )}
            </div>

            {/* ── Missing Evidence Tracker ── */}
            <div className="card">
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <Upload size={18} style={{ color: '#6366f1' }} />
                Missing Evidence This Week
                {missingEvidence.length > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                    {missingEvidence.length}
                  </span>
                )}
              </h2>
              {evidenceLoading ? (
                <div>{[1, 2, 3].map((i) => <Skeleton key={i} h={44} />)}</div>
              ) : missingEvidence.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '1.5rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={18} style={{ color: '#10b981' }} />
                  All active students have uploaded evidence this week.
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Host</th>
                        <th>Hours Progress</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingEvidence.map((p) => {
                        const pct = p.total_hours_required > 0
                          ? p.total_hours_verified / p.total_hours_required
                          : 0;
                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>
                              {p.student?.user?.full_name ?? 'Student'}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                              {p.student?.course_name ?? '—'}
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                              {p.host?.facility_name ?? '—'}
                            </td>
                            <td style={{ minWidth: 120 }}>
                              <ProgressBar pct={pct} />
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {p.total_hours_verified.toFixed(0)}/{p.total_hours_required}h
                              </div>
                            </td>
                            <td>
                              <button className="btn btn-ghost btn-sm">
                                <Bell size={12} /> Remind
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Pending Journal Reviews ── */}
            <div className="card">
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <FileText size={18} style={{ color: '#6366f1' }} />
                Pending Journal Reviews
                {pendingJournals.length > 0 && (
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    {pendingJournals.length}
                  </span>
                )}
              </h2>
              {pendingJournals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  <FileText size={28} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
                  <p>No journals pending review.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {(pendingJournals as (PlacementJournal & { _student?: Placement['student']; _placementId: string })[]).map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        gap: '0.875rem',
                        padding: '0.875rem',
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(30,41,59,0.5)',
                        border: '1px solid var(--surface-border)',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'rgba(99,102,241,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: '#818cf8',
                        }}
                      >
                        {entry._student?.user?.first_name?.[0] ?? '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {entry._student?.user?.full_name ?? 'Student'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              {formatDate(entry.entry_date)}
                            </span>
                          </div>
                          <button className="btn btn-primary btn-sm">
                            <Eye size={12} /> Review
                          </button>
                        </div>
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.375rem',
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Risk Alerts ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                Risk Alert Feed
                {criticalFlags > 0 && (
                  <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                    {criticalFlags} urgent
                  </span>
                )}
              </h2>

              {flagsLoading ? (
                <div>
                  {[1, 2, 3].map((i) => <Skeleton key={i} h={80} />)}
                </div>
              ) : allFlags.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle size={32} style={{ color: '#10b981', opacity: 0.7 }} />
                  <span>No active risk flags</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(allFlags as (RiskFlag & { _placementId: string })[]).map((flag) => (
                    <RiskFlagCard
                      key={flag.id}
                      flag={flag}
                      placementId={flag._placementId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Visit Logger */}
            <div className="card">
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <Calendar size={18} style={{ color: '#6366f1' }} />
                Log Monitoring Visit
              </h2>
              {placements.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No students assigned.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {placements.filter((p) => p.status === 'active').slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      className="btn btn-secondary btn-sm"
                      style={{ justifyContent: 'space-between' }}
                      onClick={() => setVisitModalPlacement(p)}
                    >
                      <span>{p.student?.user?.full_name ?? 'Student'}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                  {placements.filter((p) => p.status === 'active').length > 5 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      + {placements.filter((p) => p.status === 'active').length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrainerPortal;
