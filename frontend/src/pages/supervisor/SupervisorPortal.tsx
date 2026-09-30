import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  PenTool,
  Loader2,
  Award,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  MessageSquare,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import {
  listPlacements,
  getPlacementHours,
  verifyHours,
  getPlacementCompetencies,
  signoffCompetency,
  getPlacementJournal,
} from '@/api/endpoints/placements';
import apiClient from '@/api/client';
import type {
  Placement,
  PlacementHours,
  PlacementCompetency,
  ApiResponse,
} from '@/types';

/* =========================================
   TYPES
   ========================================= */

interface SupervisorFeedback {
  id: string;
  placement_id: string;
  student_id: string;
  rating: number;
  punctuality: number;
  initiative: number;
  communication: number;
  comments: string;
  created_at: string;
}

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

/* =========================================
   PROGRESS MINI-RING
   ========================================= */

const MiniProgressRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 52 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const color = pct >= 1 ? '#10b981' : pct >= 0.6 ? '#6366f1' : '#f59e0b';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.65rem',
          fontWeight: 700,
          color,
        }}
      >
        {(pct * 100).toFixed(0)}%
      </div>
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
   VERIFY HOURS MODAL
   ========================================= */

interface VerifyHoursModalProps {
  hoursEntry: PlacementHours;
  placementId: string;
  onClose: () => void;
}

const VerifyHoursModal: React.FC<VerifyHoursModalProps> = ({
  hoursEntry,
  placementId,
  onClose,
}) => {
  const qc = useQueryClient();
  const [sig, setSig] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      verifyHours(placementId, hoursEntry.id, {
        is_verified: action === 'approve',
        rejection_reason: action === 'reject' ? rejectReason : undefined,
      }),
    onSuccess: () => {
      toast.success(action === 'approve' ? 'Hours verified!' : 'Hours rejected.');
      qc.invalidateQueries({ queryKey: ['placement-hours', placementId] });
      qc.invalidateQueries({ queryKey: ['supervisor-pending-hours'] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Clock size={18} style={{ display: 'inline', marginRight: '0.5rem', color: '#6366f1' }} />
            Verify Hours Entry
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Details */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            {[
              ['Date', formatDate(hoursEntry.log_date)],
              ['Hours', `${hoursEntry.hours_worked.toFixed(2)} hrs`],
              ['Start', hoursEntry.start_time.substring(0, 5)],
              ['End', hoursEntry.end_time.substring(0, 5)],
              ['Break', `${hoursEntry.break_minutes} min`],
              ['Location', hoursEntry.location ?? '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>
              ACTIVITY DESCRIPTION
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {hoursEntry.activity_description}
            </p>
          </div>

          {/* Action Selection */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className={`btn btn-sm ${action === 'approve' ? 'btn-success' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setAction('approve')}
            >
              <ThumbsUp size={14} /> Approve
            </button>
            <button
              className={`btn btn-sm ${action === 'reject' ? 'btn-danger' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setAction('reject')}
            >
              <ThumbsDown size={14} /> Reject
            </button>
          </div>

          {action === 'approve' && (
            <div className="input-group">
              <label className="input-label">Digital Signature (type your full name)</label>
              <input
                className="input"
                placeholder="Your full name as digital signature..."
                value={sig}
                onChange={(e) => setSig(e.target.value)}
                style={{ fontFamily: 'cursive', fontSize: '1.05rem' }}
              />
            </div>
          )}

          {action === 'reject' && (
            <div className="input-group">
              <label className="input-label">Rejection Reason *</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="Explain why these hours are being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${action === 'approve' ? 'btn-success' : 'btn-danger'}`}
            disabled={
              !action ||
              mutation.isPending ||
              (action === 'approve' && !sig) ||
              (action === 'reject' && !rejectReason)
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : action === 'approve' ? (
              <CheckCircle size={14} />
            ) : (
              <XCircle size={14} />
            )}
            {action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   COMPETENCY SIGNOFF MODAL
   ========================================= */

interface CompetencySignoffModalProps {
  competency: PlacementCompetency;
  placementId: string;
  onClose: () => void;
}

const CompetencySignoffModal: React.FC<CompetencySignoffModalProps> = ({
  competency,
  placementId,
  onClose,
}) => {
  const qc = useQueryClient();
  const [sig, setSig] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      signoffCompetency(placementId, competency.id, {
        signature: sig,
        signoff_method: 'supervisor_digital',
        notes,
      }),
    onSuccess: () => {
      toast.success('Competency signed off!');
      qc.invalidateQueries({ queryKey: ['placement-competencies', placementId] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Award size={18} style={{ display: 'inline', marginRight: '0.5rem', color: '#6366f1' }} />
            Sign Off Competency
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {competency.unit_code ?? competency.competency_code}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {competency.competency_name}
            </div>
            {competency.competency_description && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {competency.competency_description}
              </p>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Notes / Observations</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Describe how the student demonstrated this competency..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Supervisor Signature *</label>
            <input
              className="input"
              placeholder="Type your full name as digital signature..."
              value={sig}
              onChange={(e) => setSig(e.target.value)}
              style={{ fontFamily: 'cursive', fontSize: '1.1rem' }}
            />
          </div>

          <div
            className="alert alert-info"
            style={{ borderRadius: 'var(--radius-lg)', fontSize: '0.8rem' }}
          >
            <AlertCircle size={15} className="alert-icon" />
            By signing, you confirm the student has satisfactorily demonstrated this unit of competency.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-success"
            disabled={!sig || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <PenTool size={14} />
            )}
            Sign Off Competency
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   STUDENT CARD (collapsible)
   ========================================= */

interface StudentCardProps {
  placement: Placement;
}

const StudentCard: React.FC<StudentCardProps> = ({ placement }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<PlacementCompetency | null>(null);

  const { data: competencies = [], isLoading: compLoading } = useQuery({
    queryKey: ['placement-competencies', placement.id],
    queryFn: () => getPlacementCompetencies(placement.id),
    enabled: expanded,
  });

  const { data: journal = [] } = useQuery({
    queryKey: ['placement-journal', placement.id],
    queryFn: () => getPlacementJournal(placement.id),
    enabled: expanded,
  });

  const pct = placement.total_hours_required > 0
    ? placement.total_hours_verified / placement.total_hours_required
    : 0;

  const lastJournal = journal.length > 0
    ? formatDate([...journal].sort((a, b) => b.entry_date.localeCompare(a.entry_date))[0].entry_date)
    : '—';

  const statusColor: Record<string, string> = {
    active: '#10b981',
    at_risk: '#ef4444',
    pending: '#f59e0b',
    completed: '#3b82f6',
    cancelled: '#6b7280',
    approved: '#6366f1',
    suspended: '#f87171',
  };

  return (
    <>
      {selectedCompetency && (
        <CompetencySignoffModal
          competency={selectedCompetency}
          placementId={placement.id}
          onClose={() => setSelectedCompetency(null)}
        />
      )}

      <div
        className="card"
        style={{ cursor: 'pointer', transition: 'all var(--transition-base)' }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
          onClick={() => setExpanded((e) => !e)}
        >
          <MiniProgressRing pct={pct} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {placement.student?.user?.full_name ?? 'Unknown Student'}
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
                {placement.status}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              {placement.student?.course_name ?? '—'} · Last journal: {lastJournal}
            </div>
          </div>
          <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {placement.total_hours_verified.toFixed(0)} / {placement.total_hours_required}h
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {placement.total_hours_logged.toFixed(0)}h logged
            </div>
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {expanded && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
            {compLoading ? (
              <div>
                <Skeleton h={14} />
                <Skeleton h={14} w="80%" />
                <Skeleton h={14} w="90%" />
              </div>
            ) : competencies.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No competencies defined for this placement.
              </p>
            ) : (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>
                  COMPETENCY SIGN-OFF ({competencies.filter((c) => c.is_achieved).length}/{competencies.length} achieved)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {competencies.map((comp) => (
                    <div
                      key={comp.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-lg)',
                        background: comp.is_achieved
                          ? 'rgba(16,185,129,0.06)'
                          : 'rgba(30,41,59,0.5)',
                        border: `1px solid ${comp.is_achieved ? 'rgba(16,185,129,0.2)' : 'var(--surface-border)'}`,
                      }}
                    >
                      {comp.is_achieved ? (
                        <CheckCircle size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                      ) : (
                        <div
                          style={{
                            width: 15,
                            height: 15,
                            borderRadius: '50%',
                            border: '2px solid var(--surface-border)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                          {comp.unit_code ?? comp.competency_code}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {comp.competency_name}
                        </div>
                      </div>
                      {!comp.is_achieved ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedCompetency(comp)}
                        >
                          <PenTool size={12} /> Sign Off
                        </button>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: '#34d399' }}>
                          {comp.achieved_at ? formatDate(comp.achieved_at) : 'Achieved'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

/* =========================================
   FEEDBACK MODAL
   ========================================= */

interface FeedbackModalProps {
  placement: Placement;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ placement, onClose }) => {
  const [form, setForm] = useState({
    rating: 5,
    punctuality: 5,
    initiative: 5,
    communication: 5,
    comments: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiClient
        .post<ApiResponse<SupervisorFeedback>>(`/placements/${placement.id}/feedback`, form)
        .then((r) => r.data.data),
    onSuccess: () => {
      toast.success('Feedback submitted!');
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const RatingRow = ({ label, field }: { label: string; field: keyof typeof form }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: 120 }}>{label}</span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setForm((f) => ({ ...f, [field]: n }))}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.125rem',
              color: n <= (form[field] as number) ? '#f59e0b' : 'var(--surface-border)',
              transition: 'color var(--transition-fast)',
            }}
          >
            <Star size={22} fill={n <= (form[field] as number) ? '#f59e0b' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <MessageSquare size={18} style={{ display: 'inline', marginRight: '0.5rem', color: '#6366f1' }} />
            Supervisor Feedback — {placement.student?.user?.full_name}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <RatingRow label="Overall Rating" field="rating" />
          <RatingRow label="Punctuality" field="punctuality" />
          <RatingRow label="Initiative" field="initiative" />
          <RatingRow label="Communication" field="communication" />
          <div className="input-group" style={{ marginTop: '0.5rem' }}>
            <label className="input-label">Qualitative Comments</label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="How is the student performing? Any specific strengths or areas for improvement?"
              value={form.comments}
              onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
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
              <Star size={14} />
            )}
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   MAIN PAGE
   ========================================= */

/**
 * SupervisorPortal — Supervisor-facing dashboard for verifying hours,
 * signing off competencies, and submitting student feedback.
 */
const SupervisorPortal: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [selectedHours, setSelectedHours] = useState<{ entry: PlacementHours; placementId: string } | null>(null);
  const [feedbackPlacement, setFeedbackPlacement] = useState<Placement | null>(null);

  // Fetch all placements assigned to this supervisor
  const { data: placementsData, isLoading: placementsLoading } = useQuery({
    queryKey: ['supervisor-placements'],
    queryFn: () => listPlacements({ limit: 100, status: 'active' }),
    enabled: !!user,
  });

  const placements = placementsData?.data ?? [];

  // Fetch all hours across placements (pending verification)
  const { data: allHours = [], isLoading: hoursLoading } = useQuery({
    queryKey: ['supervisor-pending-hours'],
    queryFn: async () => {
      const results = await Promise.all(
        placements.map((p) =>
          getPlacementHours(p.id).then((hours) =>
            hours
              .filter((h) => !h.is_verified && !h.rejection_reason)
              .map((h) => ({ ...h, _placementId: p.id, _student: p.student })),
          ),
        ),
      );
      return results.flat();
    },
    enabled: placements.length > 0,
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (_sig: string) => {
      await Promise.all(
        allHours.map((h) =>
          verifyHours((h as PlacementHours & { _placementId: string })._placementId, h.id, {
            is_verified: true,
          }),
        ),
      );
    },
    onSuccess: () => {
      toast.success(`Bulk approved ${allHours.length} entries!`);
      qc.invalidateQueries({ queryKey: ['supervisor-pending-hours'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Stats
  const totalStudents = placements.length;
  const pendingVerifications = allHours.length;
  const thisMonthVerified = 0; // Would need separate query

  if (placementsLoading) {
    return (
      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="stat-card stat-card-primary">
            <Skeleton h={48} w="48px" />
            <Skeleton h={32} w="60%" />
            <Skeleton h={14} w="40%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {selectedHours && (
        <VerifyHoursModal
          hoursEntry={selectedHours.entry}
          placementId={selectedHours.placementId}
          onClose={() => setSelectedHours(null)}
        />
      )}
      {feedbackPlacement && (
        <FeedbackModal
          placement={feedbackPlacement}
          onClose={() => setFeedbackPlacement(null)}
        />
      )}

      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            Supervisor Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Welcome back, {user?.first_name ?? 'Supervisor'}
          </p>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {[
            {
              icon: <Users size={22} />,
              value: totalStudents,
              label: 'Assigned Students',
              cls: 'stat-card-primary',
              icls: 'stat-card-icon-primary',
            },
            {
              icon: <Clock size={22} />,
              value: pendingVerifications,
              label: 'Pending Verifications',
              cls: 'stat-card-warning',
              icls: 'stat-card-icon-warning',
            },
            {
              icon: <CheckCircle size={22} />,
              value: thisMonthVerified,
              label: 'Verified This Month',
              cls: 'stat-card-success',
              icls: 'stat-card-icon-success',
            },
          ].map((s) => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className={`stat-card-icon ${s.icls}`}>{s.icon}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Pending Hour Verifications ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: '#6366f1' }} />
              Pending Hour Verifications
              {pendingVerifications > 0 && (
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                  {pendingVerifications}
                </span>
              )}
            </h2>
            {pendingVerifications > 0 && (
              <button
                className="btn btn-success btn-sm"
                disabled={bulkApproveMutation.isPending}
                onClick={() => {
                  const sig = prompt('Type your name to bulk approve all pending hours:');
                  if (sig) bulkApproveMutation.mutate(sig);
                }}
              >
                {bulkApproveMutation.isPending ? (
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ThumbsUp size={13} />
                )}
                Bulk Approve All ({pendingVerifications})
              </button>
            )}
          </div>

          {hoursLoading ? (
            <div>
              {[1, 2, 3].map((i) => <Skeleton key={i} h={52} />)}
            </div>
          ) : allHours.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle size={36} style={{ color: '#10b981', opacity: 0.7 }} />
              <span>All hours are verified. Great work!</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>Start / End</th>
                    <th>Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allHours.map((h) => {
                    const entry = h as PlacementHours & { _placementId: string; _student?: Placement['student'] };
                    return (
                      <tr key={entry.id}>
                        <td style={{ fontWeight: 600 }}>
                          {entry._student?.user?.full_name ?? 'Student'}
                        </td>
                        <td>{entry.log_date}</td>
                        <td>
                          <span
                            className="badge badge-primary"
                            style={{ fontSize: '0.75rem' }}
                          >
                            {entry.hours_worked.toFixed(2)}h
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {entry.start_time.substring(0, 5)} – {entry.end_time.substring(0, 5)}
                        </td>
                        <td
                          style={{
                            maxWidth: 260,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {entry.activity_description}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() =>
                                setSelectedHours({ entry, placementId: entry._placementId })
                              }
                            >
                              <CheckCircle size={13} /> Verify
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Assigned Learners ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
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
            <UserCheck size={18} style={{ color: '#6366f1' }} />
            Assigned Learners
          </h2>
          {placements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No active placements assigned to you.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {placements.map((p) => (
                <div key={p.id}>
                  <StudentCard placement={p} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.25rem' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setFeedbackPlacement(p)}
                    >
                      <MessageSquare size={12} /> Submit Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SupervisorPortal;
