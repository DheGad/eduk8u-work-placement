import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  Clock,
  BookOpen,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ChevronRight,
  Award,
  Shield,
  Smile,
  Meh,
  Frown,
  X,
  Calendar,
  MapPin,
  PenTool,
  Eye,
  TrendingUp,
  Loader2,
} from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import MyTasksWidget from '@/components/shared/MyTasksWidget';
import {
  getPlacementHours,
  logHours,
  getPlacementJournal,
  addJournalEntry,
  getPlacementEvidence,
  uploadEvidence,
  getTripartiteAgreement,
  signTripartiteAgreement,
  getPlacementCompetencies,
  listPlacements,
} from '@/api/endpoints/placements';
import { getStudentReadiness } from '@/api/endpoints/students';
import type {
  PlacementHours,
  Placement,
  PlacementReadiness,
  RiskLevel,
} from '@/types';

/* =========================================
   HELPER UTILITIES
   ========================================= */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}


function today(): string {
  return new Date().toISOString().split('T')[0];
}

function riskBadgeClass(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    none: 'badge-success',
    low: 'badge-info',
    medium: 'badge-warning',
    high: 'badge-danger',
    critical: 'badge-danger',
  };
  return map[risk] ?? 'badge-neutral';
}

/** Aggregate hours logs into weekly buckets for the bar chart */
function buildWeeklyData(hours: PlacementHours[]) {
  const buckets: Record<string, number> = {};
  hours.forEach((h) => {
    const d = new Date(h.log_date);
    // ISO week label: "Wk MM/DD"
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const label = `${monday.getMonth() + 1}/${monday.getDate()}`;
    buckets[label] = (buckets[label] ?? 0) + h.hours_worked;
  });
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, hours]) => ({ week, hours: +hours.toFixed(2) }));
}

/* =========================================
   PROGRESS RING
   ========================================= */

interface ProgressRingProps {
  verified: number;
  required: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  verified,
  required,
  size = 160,
  strokeWidth = 12,
}) => {
  const pct = Math.min(verified / Math.max(required, 1), 1);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color =
    pct >= 1
      ? 'var(--color-success)'
      : pct >= 0.75
        ? '#6366f1'
        : pct >= 0.5
          ? '#f59e0b'
          : '#ef4444';

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg
        className="progress-ring-svg"
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          className="progress-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="progress-ring-label">
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {verified.toFixed(0)}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          / {required} hrs
        </span>
        <span style={{ fontSize: '0.7rem', color, fontWeight: 600, marginTop: 2 }}>
          {(pct * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

/* =========================================
   MILESTONE BADGES
   ========================================= */

const MILESTONES = [25, 50, 75, 90, 100] as const;

interface MilestoneBadgesProps {
  pct: number;
}

const MilestoneBadges: React.FC<MilestoneBadgesProps> = ({ pct }) => (
  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
    {MILESTONES.map((m) => {
      const achieved = pct >= m;
      return (
        <div
          key={m}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius-full)',
            background: achieved
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(100,116,139,0.10)',
            border: `1px solid ${achieved ? 'rgba(16,185,129,0.3)' : 'var(--surface-border)'}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: achieved ? '#34d399' : 'var(--text-muted)',
          }}
        >
          {achieved ? (
            <CheckCircle size={12} style={{ color: '#10b981' }} />
          ) : (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid var(--surface-border)',
              }}
            />
          )}
          {m}%
        </div>
      );
    })}
  </div>
);

/* =========================================
   SKELETON
   ========================================= */

const SkeletonCard: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="card">
    <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: '1rem' }} />
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="skeleton"
        style={{ height: 14, width: '75%', marginBottom: '0.5rem' }}
      />
    ))}
  </div>
);

/* =========================================
   LOG HOURS MODAL
   ========================================= */

interface LogHoursModalProps {
  placementId: string;
  onClose: () => void;
}

const LogHoursModal: React.FC<LogHoursModalProps> = ({ placementId, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    log_date: today(),
    start_time: '08:00',
    end_time: '16:00',
    break_minutes: 30,
    activity_description: '',
    location: '',
  });
  const [sig, setSig] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      logHours(placementId, {
        ...form,
        break_minutes: Number(form.break_minutes),
        supervisor_signature: sig || undefined,
      }),
    onSuccess: () => {
      toast.success('Hours logged successfully!');
      qc.invalidateQueries({ queryKey: ['placement-hours', placementId] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function field(
    k: keyof typeof form,
    label: string,
    type = 'text',
    extra?: React.InputHTMLAttributes<HTMLInputElement>,
  ) {
    return (
      <div className="input-group">
        <label className="input-label">{label}</label>
        <input
          className="input"
          type={type}
          value={form[k] as string | number}
          onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
          {...extra}
        />
      </div>
    );
  }

  const calcHours = () => {
    try {
      const [sh, sm] = form.start_time.split(':').map(Number);
      const [eh, em] = form.end_time.split(':').map(Number);
      const total = (eh * 60 + em - (sh * 60 + sm) - Number(form.break_minutes)) / 60;
      return Math.max(0, total).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Clock size={18} style={{ display: 'inline', marginRight: '0.5rem', color: '#6366f1' }} />
            Log Today's Hours
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {field('log_date', 'Date', 'date')}
          {field('location', 'Location')}
          {field('start_time', 'Start Time', 'time')}
          {field('end_time', 'End Time', 'time')}
          <div className="input-group">
            <label className="input-label">Break (minutes)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={480}
              value={form.break_minutes}
              onChange={(e) => setForm((f) => ({ ...f, break_minutes: +e.target.value }))}
            />
          </div>
          <div
            className="card"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculated Hours</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1' }}>
              {calcHours()}
            </span>
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Activity Description *</label>
            <textarea
              className="textarea"
              rows={3}
              required
              placeholder="Describe the activities you performed today..."
              value={form.activity_description}
              onChange={(e) =>
                setForm((f) => ({ ...f, activity_description: e.target.value }))
              }
            />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Supervisor Signature (type name to sign)</label>
            <input
              className="input"
              placeholder="Type supervisor's full name as signature..."
              value={sig}
              onChange={(e) => setSig(e.target.value)}
              style={{ fontFamily: 'cursive', fontSize: '1.1rem' }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={mutation.isPending || !form.activity_description}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Clock size={14} />
            )}
            Log {calcHours()} Hours
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   JOURNAL ENTRY MODAL
   ========================================= */

const MOOD_OPTIONS = [
  { value: 'great', label: 'Great', icon: <Smile size={20} />, color: '#10b981' },
  { value: 'okay', label: 'Okay', icon: <Meh size={20} />, color: '#f59e0b' },
  { value: 'tough', label: 'Tough', icon: <Frown size={20} />, color: '#ef4444' },
];

interface JournalEntryModalProps {
  placementId: string;
  onClose: () => void;
}

const JournalEntryModal: React.FC<JournalEntryModalProps> = ({ placementId, onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    entry_date: today(),
    content: '',
    reflections: '',
    visibility: 'trainer_visible' as 'student_only' | 'trainer_visible' | 'all',
  });
  const [mood, setMood] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      addJournalEntry(placementId, {
        ...form,
        content: mood ? `[Mood: ${mood}]\n\n${form.content}` : form.content,
      }),
    onSuccess: () => {
      toast.success('Journal entry saved!');
      qc.invalidateQueries({ queryKey: ['placement-journal', placementId] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <BookOpen
              size={18}
              style={{ display: 'inline', marginRight: '0.5rem', color: '#6366f1' }}
            />
            Add Journal Entry
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Date</label>
            <input
              className="input"
              type="date"
              value={form.entry_date}
              onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">How was your day?</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${mood === m.value ? m.color : 'var(--surface-border)'}`,
                    background:
                      mood === m.value ? `${m.color}15` : 'var(--surface-input)',
                    color: mood === m.value ? m.color : 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Journal Entry *</label>
            <textarea
              className="textarea"
              rows={5}
              required
              placeholder="What did you do today? What did you learn? Any challenges?"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Reflections (optional)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="What would you do differently? What are your goals for tomorrow?"
              value={form.reflections}
              onChange={(e) => setForm((f) => ({ ...f, reflections: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Visibility</label>
            <select
              className="select"
              value={form.visibility}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  visibility: e.target.value as typeof form.visibility,
                }))
              }
            >
              <option value="student_only">Private (me only)</option>
              <option value="trainer_visible">Trainer can see</option>
              <option value="all">All parties</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={mutation.isPending || !form.content}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <BookOpen size={14} />
            )}
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   EVIDENCE UPLOAD MODAL
   ========================================= */

interface EvidenceUploadModalProps {
  placementId: string;
  onClose: () => void;
}

const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({ placementId, onClose }) => {
  const qc = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState({ title: '', description: '', evidence_type: 'document' });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      setMeta((m) => ({ ...m, title: m.title || f.name.replace(/\.[^.]+$/, '') }));
    }
  }, []);

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', meta.title);
      fd.append('description', meta.description);
      fd.append('evidence_type', meta.evidence_type);
      return uploadEvidence(placementId, fd);
    },
    onSuccess: () => {
      toast.success('Evidence uploaded!');
      qc.invalidateQueries({ queryKey: ['placement-evidence', placementId] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Upload
              size={18}
              style={{ display: 'inline', marginRight: '0.5rem', color: '#6366f1' }}
            />
            Upload Evidence
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging || file ? '#6366f1' : 'var(--surface-border)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              background: dragging
                ? 'rgba(99,102,241,0.08)'
                : file
                  ? 'rgba(99,102,241,0.04)'
                  : 'var(--surface-input)',
              transition: 'all var(--transition-base)',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  setMeta((m) => ({ ...m, title: m.title || f.name.replace(/\.[^.]+$/, '') }));
                }
              }}
            />
            <Upload size={32} style={{ color: file ? '#6366f1' : 'var(--text-muted)' }} />
            {file ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Drop file here or click to browse
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  PDF, DOC, JPG, PNG, MP4 — max 50MB
                </div>
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Title *</label>
            <input
              className="input"
              placeholder="e.g. Patient Assessment Observation"
              value={meta.title}
              onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Evidence Type</label>
            <select
              className="select"
              value={meta.evidence_type}
              onChange={(e) => setMeta((m) => ({ ...m, evidence_type: e.target.value }))}
            >
              <option value="document">Document</option>
              <option value="image">Image / Photo</option>
              <option value="video">Video</option>
              <option value="link">External Link</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Description (optional)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Describe what this evidence demonstrates..."
              value={meta.description}
              onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={mutation.isPending || !file || !meta.title}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload size={14} />
            )}
            Upload Evidence
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   MAIN PAGE
   ========================================= */

type ModalType = 'log-hours' | 'journal' | 'evidence' | null;

/**
 * StudentPortal — The full student-facing dashboard for placement tracking.
 * Fetches live placement data, hours, journal entries, evidence, agreement,
 * competencies, and readiness checklist. All mutations call real API endpoints.
 */
const StudentPortal: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [modal, setModal] = useState<ModalType>(null);

  // 1. Fetch active placement
  const { data: placementsData, isLoading: placementsLoading } = useQuery({
    queryKey: ['my-placements'],
    queryFn: () => listPlacements({ limit: 1, status: 'active' }),
    enabled: !!user,
  });

  const placement: Placement | undefined = placementsData?.data[0];
  const placementId = placement?.id;

  // 2. Hours
  const { data: hours = [], isLoading: hoursLoading } = useQuery({
    queryKey: ['placement-hours', placementId],
    queryFn: () => getPlacementHours(placementId!),
    enabled: !!placementId,
  });

  // 3. Journal
  const { data: journal = [], isLoading: journalLoading } = useQuery({
    queryKey: ['placement-journal', placementId],
    queryFn: () => getPlacementJournal(placementId!),
    enabled: !!placementId,
  });

  // 4. Evidence
  const { data: evidence = [], isLoading: evidenceLoading } = useQuery({
    queryKey: ['placement-evidence', placementId],
    queryFn: () => getPlacementEvidence(placementId!),
    enabled: !!placementId,
  });

  // 5. Tripartite Agreement
  const { data: agreement } = useQuery({
    queryKey: ['placement-agreement', placementId],
    queryFn: () => getTripartiteAgreement(placementId!),
    enabled: !!placementId,
  });

  // 6. Competencies
  const { data: competencies = [] } = useQuery({
    queryKey: ['placement-competencies', placementId],
    queryFn: () => getPlacementCompetencies(placementId!),
    enabled: !!placementId,
  });

  // 7. Readiness (student profile from placement.student)
  const studentId = placement?.student_id;
  const { data: readiness } = useQuery({
    queryKey: ['student-readiness', studentId],
    queryFn: () => getStudentReadiness(studentId!),
    enabled: !!studentId,
  });

  const qc = useQueryClient();
  const signAgreementMutation = useMutation({
    mutationFn: (sig: string) =>
      signTripartiteAgreement(placementId!, { signature: sig, role: 'student' }),
    onSuccess: () => {
      toast.success('Agreement signed successfully!');
      qc.invalidateQueries({ queryKey: ['placement-agreement', placementId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Derived stats
  const verifiedHours = hours
    .filter((h) => h.is_verified)
    .reduce((acc, h) => acc + h.hours_worked, 0);
  const totalRequired = placement?.total_hours_required ?? 120;
  const pct = (verifiedHours / totalRequired) * 100;
  const weeklyData = buildWeeklyData(hours);
  const recentJournal = [...journal]
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .slice(0, 7);
  const todayEntry = journal.find((j) => j.entry_date === today());

  const readinessItems: { key: keyof PlacementReadiness; label: string }[] = [
    { key: 'has_police_check', label: 'National Police Check' },
    { key: 'has_wwcc', label: 'Working With Children Check (WWCC)' },
    { key: 'has_first_aid', label: 'First Aid Certificate' },
    { key: 'has_ohsw_training', label: 'OHS&W Induction' },
    { key: 'has_mandatory_reporting', label: 'Mandatory Reporting' },
    { key: 'has_completed_orientation', label: 'Placement Orientation' },
    { key: 'has_submitted_resume', label: 'Resume Submitted' },
    { key: 'has_signed_code_of_conduct', label: 'Code of Conduct Signed' },
    { key: 'has_insurance_confirmation', label: 'Insurance Confirmation' },
    { key: 'has_ndis_clearance', label: 'NDIS Clearance' },
  ];

  if (placementsLoading) {
    return (
      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} rows={4} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {modal === 'log-hours' && placementId && (
        <LogHoursModal placementId={placementId} onClose={() => setModal(null)} />
      )}
      {modal === 'journal' && placementId && (
        <JournalEntryModal placementId={placementId} onClose={() => setModal(null)} />
      )}
      {modal === 'evidence' && placementId && (
        <EvidenceUploadModal placementId={placementId} onClose={() => setModal(null)} />
      )}

      <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Welcome back, {user?.first_name ?? 'Student'} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {new Date().toLocaleDateString('en-AU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setModal('journal')}
              disabled={!placementId}
            >
              <BookOpen size={14} /> Add Journal
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setModal('log-hours')}
              disabled={!placementId}
            >
              <Clock size={14} /> Log Hours
            </button>
          </div>
        </div>

        {/* ── No Active Placement Banner ── */}
        {!placement && !placementsLoading && (
          <div
            className="alert alert-info"
            style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-xl)' }}
          >
            <AlertCircle className="alert-icon" />
            <div>
              <strong>No Active Placement</strong>
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                You don't have an active placement. Contact your trainer to get started.
              </p>
            </div>
          </div>
        )}

        {/* ── Placement Status Banner ── */}
        {placement && (
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              background:
                'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(15,23,42,0.8) 100%)',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Placement #
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {placement.placement_number}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Host Facility
                </div>
                <div style={{ fontWeight: 600 }}>{placement.host?.facility_name ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Status
                </div>
                <span
                  className={`badge badge-${
                    placement.status === 'active'
                      ? 'success'
                      : placement.status === 'at_risk'
                        ? 'danger'
                        : 'info'
                  }`}
                >
                  {placement.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Risk Level
                </div>
                <span className={`badge ${riskBadgeClass(placement.risk_level)}`}>
                  <span className="badge-dot" />
                  {placement.risk_level}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Period
                </div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  {formatDate(placement.planned_start_date)} — {formatDate(placement.planned_end_date)}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <ProgressRing verified={verifiedHours} required={totalRequired} size={100} strokeWidth={10} />
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* ── Hours Progress ── */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
              }}
            >
              <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} style={{ color: '#6366f1' }} />
                Hours Progress
              </h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setModal('log-hours')}
                disabled={!placementId}
              >
                <Plus size={13} /> Log Today
              </button>
            </div>

            {hoursLoading ? (
              <div className="skeleton" style={{ height: 200 }} />
            ) : (
              <div
                style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <ProgressRing verified={verifiedHours} required={totalRequired} />
                  <MilestoneBadges pct={pct} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {hours.length} entries · {hours.filter((h) => !h.is_verified).length} pending verification
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyData} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                        <XAxis
                          dataKey="week"
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}h`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            color: '#f1f5f9',
                            fontSize: 13,
                          }}
                          formatter={(v) => [`${v} hrs`, 'Hours']}
                        />
                        <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      style={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <Clock size={32} />
                      <span>No hours logged yet</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Agreement Status ── */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: '#6366f1' }} />
                CA0355 Tripartite Agreement
              </h2>
            </div>

            {!agreement ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {placementId ? 'Loading agreement...' : 'No active placement'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(
                  [
                    { label: 'Your Signature', signed: agreement.student_signed, date: agreement.student_signed_at, role: 'student' as const },
                    { label: 'Host Signature', signed: agreement.host_signed, date: agreement.host_signed_at, role: 'host' as const },
                    { label: 'Trainer Signature', signed: agreement.trainer_signed, date: agreement.trainer_signed_at, role: 'trainer' as const },
                  ] as const
                ).map((party) => (
                  <div
                    key={party.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-lg)',
                      background: party.signed
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(100,116,139,0.06)',
                      border: `1px solid ${party.signed ? 'rgba(16,185,129,0.2)' : 'var(--surface-border)'}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{party.label}</div>
                      {party.date && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(party.date)}
                        </div>
                      )}
                    </div>
                    {party.signed ? (
                      <CheckCircle size={18} style={{ color: '#10b981' }} />
                    ) : (
                      <XCircle size={18} style={{ color: '#ef4444' }} />
                    )}
                  </div>
                ))}
                {!agreement.student_signed && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => {
                      const sig = prompt('Type your full name to sign the tripartite agreement:');
                      if (sig) signAgreementMutation.mutate(sig);
                    }}
                    disabled={signAgreementMutation.isPending}
                  >
                    <PenTool size={13} />
                    {signAgreementMutation.isPending ? 'Signing...' : 'Sign Agreement'}
                  </button>
                )}
                {agreement.is_complete && (
                  <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>
                    <CheckCircle size={11} /> Fully Executed
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Daily Journal ── */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} style={{ color: '#6366f1' }} />
                Daily Journal
              </h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setModal('journal')}
                disabled={!placementId}
              >
                <Plus size={13} /> Add Entry
              </button>
            </div>

            {journalLoading ? (
              <SkeletonCard rows={3} />
            ) : todayEntry ? (
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#818cf8',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}
                >
                  TODAY'S ENTRY
                </div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {todayEntry.content.slice(0, 200)}
                  {todayEntry.content.length > 200 && '...'}
                </p>
              </div>
            ) : (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  marginBottom: '1rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fbbf24' }}>
                    No entry today
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Regular journaling is required for your placement.
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentJournal.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.625rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(30,41,59,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {formatDate(entry.entry_date)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className={`badge badge-${
                        entry.visibility === 'student_only' ? 'neutral' : 'info'
                      }`}
                      style={{ fontSize: '0.65rem' }}
                    >
                      {entry.visibility === 'student_only' ? 'Private' : 'Shared'}
                    </span>
                    <Eye size={13} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                  </div>
                </div>
              ))}
              {recentJournal.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No journal entries yet.
                </p>
              )}
            </div>
          </div>

          {/* ── Evidence Uploads ── */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} style={{ color: '#6366f1' }} />
                Evidence Portfolio
                <span
                  className="badge badge-primary"
                  style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}
                >
                  {evidence.length}
                </span>
              </h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setModal('evidence')}
                disabled={!placementId}
              >
                <Upload size={13} /> Upload
              </button>
            </div>

            {evidenceLoading ? (
              <SkeletonCard rows={3} />
            ) : evidence.length === 0 ? (
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
                <Upload size={32} style={{ opacity: 0.4 }} />
                <span>No evidence uploaded yet</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {evidence.slice(0, 5).map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(30,41,59,0.5)',
                      border: '1px solid var(--surface-border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(99,102,241,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={14} style={{ color: '#818cf8' }} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {ev.evidence_type} · {formatDate(ev.created_at)}
                      </div>
                    </div>
                    {ev.is_verified ? (
                      <CheckCircle size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        Pending
                      </span>
                    )}
                  </div>
                ))}
                {evidence.length > 5 && (
                  <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }}>
                    View all {evidence.length} <ChevronRight size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Readiness Checklist ── */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Shield size={18} style={{ color: '#6366f1' }} />
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>CA0398 Readiness Checklist</h2>
              {readiness && (
                <span
                  className={`badge ${
                    readiness.readiness_percentage >= 100
                      ? 'badge-success'
                      : readiness.readiness_percentage >= 70
                        ? 'badge-warning'
                        : 'badge-danger'
                  }`}
                  style={{ marginLeft: 'auto', fontSize: '0.7rem' }}
                >
                  {readiness.readiness_percentage.toFixed(0)}% Ready
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {readinessItems.map(({ key, label }) => {
                const done = readiness ? !!(readiness[key] as boolean) : false;
                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: done ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.04)',
                    }}
                  >
                    {done ? (
                      <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    ) : (
                      <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: done ? 'var(--text-primary)' : 'var(--text-muted)',
                        textDecoration: !done ? 'none' : 'none',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
              {!readiness && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading checklist...</p>}
            </div>

            {readiness?.trainer_approved && (
              <div
                className="alert alert-success"
                style={{ marginTop: '1rem', borderRadius: 'var(--radius-lg)' }}
              >
                <Award className="alert-icon" />
                <div>
                  <strong>Trainer Approved</strong>
                  {readiness.trainer_approved_at && (
                    <p style={{ fontSize: '0.8rem', marginTop: '0.125rem' }}>
                      Approved on {formatDate(readiness.trainer_approved_at)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Competency Units ── */}
          {competencies.length > 0 && (
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Award size={18} style={{ color: '#6366f1' }} />
                <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Competency Units</h2>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>
                  {competencies.filter((c) => c.is_achieved).length} / {competencies.length} achieved
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {competencies.map((comp) => (
                  <div
                    key={comp.id}
                    style={{
                      padding: '0.875rem',
                      borderRadius: 'var(--radius-lg)',
                      background: comp.is_achieved
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(30,41,59,0.5)',
                      border: `1px solid ${comp.is_achieved ? 'rgba(16,185,129,0.2)' : 'var(--surface-border)'}`,
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    {comp.is_achieved ? (
                      <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: '2px solid var(--surface-border)',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                        {comp.unit_code ?? comp.competency_code}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        {comp.competency_name}
                      </div>
                      {comp.is_achieved && comp.achieved_at && (
                        <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.25rem' }}>
                          Achieved {formatDate(comp.achieved_at)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentPortal;
